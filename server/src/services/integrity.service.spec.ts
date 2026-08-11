import { IntegrityReport } from 'src/enum';
import { IntegrityService } from 'src/services/integrity.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(IntegrityService.name, () => {
  let sut: IntegrityService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(IntegrityService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleDeleteAllIntegrityReports', () => {
    beforeEach(() => {
      mocks.integrityReport.streamIntegrityReportsByProperty.mockReturnValue((function* () {})() as never);
    });

    it('should query all property types when no type specified', async () => {
      await sut.handleDeleteAllIntegrityReports({});

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(undefined, undefined);
      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith('assetId', undefined);
      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith('fileAssetId', undefined);
    });
  });

  describe('handleUntrackedFiles', () => {
    it('should not flag a file as untracked when disk path is NFD and DB path is NFC', async () => {
      // "café" — the 'é' encoded as NFD (e + combining accent) vs NFC (precomposed)
      const nfdPath = '/data/upload/cafe\u0301.jpg'; // macOS APFS returns NFD
      const nfcPath = '/data/upload/caf\u00E9.jpg'; // DB stores NFC

      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: nfcPath, encodedVideoPath: null },
      ]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);

      await sut.handleUntrackedFiles({ type: 'asset', paths: [nfdPath] });

      // The file exists in the DB (as NFC), so it must not be reported as untracked.
      expect(mocks.integrityReport.create).not.toHaveBeenCalled();
    });

    it('should not flag a thumbnail as untracked when disk path is NFD and DB path is NFC', async () => {
      const nfdPath = '/data/thumbs/cafe\u0301-thumb.webp';
      const nfcPath = '/data/thumbs/caf\u00E9-thumb.webp';

      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([{ thumbnailPath: nfcPath }]);

      await sut.handleUntrackedFiles({ type: 'asset_file', paths: [nfdPath] });

      expect(mocks.integrityReport.create).not.toHaveBeenCalled();
    });

    it('should still report genuinely untracked files', async () => {
      const path = '/data/upload/orphan.jpg';

      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);

      await sut.handleUntrackedFiles({ type: 'asset', paths: [path] });

      expect(mocks.integrityReport.create).toHaveBeenCalledWith([
        { type: IntegrityReport.UntrackedFile, path },
      ]);
    });
  });
});
