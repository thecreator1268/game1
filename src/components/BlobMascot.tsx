// One consistent mascot shape, "vary blob radius/mouth slightly per card
// for character" — picked deterministically from the game id so a card
// never re-rolls its own face between renders. Shared by the game cards and
// the first-launch intro so the intro shows the exact mascot patients will
// meet on the home screen, not a new art style.
const BLOB_VARIANTS = ['', 'blob-v2', 'blob-v3', 'blob-v4'];

function blobVariant(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return BLOB_VARIANTS[hash % BLOB_VARIANTS.length];
}

export function BlobMascot({ gameId, hero = false }: { gameId: string; hero?: boolean }) {
  return (
    <div className={`blob-mascot ${blobVariant(gameId)} ${hero ? 'blob-mascot-hero' : ''}`} aria-hidden>
      <div className="blob-face">
        <div className="blob-eye blob-eye-l" />
        <div className="blob-eye blob-eye-r" />
        <div className="blob-blush blob-blush-l" />
        <div className="blob-blush blob-blush-r" />
        <div className="blob-mouth" />
      </div>
    </div>
  );
}
