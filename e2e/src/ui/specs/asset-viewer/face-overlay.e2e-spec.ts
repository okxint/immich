import { expect, test } from '@playwright/test';
import { toAssetResponseDto } from 'src/ui/generators/timeline';
import {
  createMockFaceData,
  type MockFaceSpec,
  setupFaceOverlayMockApiRoutes,
} from 'src/ui/mock-network/face-editor-network';
import { assetViewerUtils } from '../timeline/utils';
import { ensureDetailPanelVisible, setupAssetViewerFixture } from './utils';

test.describe.configure({ mode: 'parallel' });

test.describe('face removal auto-close', () => {
  const fixture = setupAssetViewerFixture(903);
  const singleFaceSpec: MockFaceSpec[] = [
    {
      personId: 'person-solo',
      personName: 'Solo Person',
      faceId: 'face-solo',
      boundingBoxX1: 1000,
      boundingBoxY1: 500,
      boundingBoxX2: 1500,
      boundingBoxY2: 1200,
    },
  ];

  test.beforeEach(async ({ context }) => {
    const faceData = createMockFaceData(
      singleFaceSpec,
      fixture.primaryAssetDto.width ?? 3000,
      fixture.primaryAssetDto.height ?? 4000,
    );
    const assetDtoWithFaces = toAssetResponseDto(fixture.primaryAsset, undefined, faceData);
    await setupFaceOverlayMockApiRoutes(context, assetDtoWithFaces, singleFaceSpec);
  });

  test('person side panel closes when last face is removed', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await ensureDetailPanelVisible(page);

    const editPeopleButton = page.locator('#detail-panel').getByLabel('Edit people');
    await expect(editPeopleButton).toBeVisible();
    await editPeopleButton.click();

    const personName = page.locator('text=Solo Person');
    await expect(personName.first()).toBeVisible({ timeout: 5000 });

    const deleteButton = page.getByLabel('Delete face');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    const confirmButton = page.getByRole('button', { name: /confirm/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    await expect(page.locator('text=Edit faces')).toBeHidden({ timeout: 5000 });
  });
});
