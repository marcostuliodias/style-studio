import React from 'react';
import { Img, staticFile } from 'remotion';
import { rgba } from '../engine/colour';
import { HERO, P, PACK } from '../engine/style';
import { cardStyle } from './card';
import { Rise } from './Rise';
import { Heavy, Label } from './Voices';

// The creator's badge: their photo in a ring, their @ in the headline voice and their name under it, on a small card of
// the pack's surface, in the top left over a full-frame presenter shot (the opening, the end). The one place the
// creator's own identity shows in the style: the pack still picks the surface, the voices and the hero colour.

export type Creator = { name: string; handle: string; photo?: string; niche?: string };

export const Badge: React.FC<{ creator: Creator }> = ({ creator }) => {
  const photo = creator.photo ? (/^(blob:|https?:|data:)/.test(creator.photo) ? creator.photo : staticFile(creator.photo)) : null;
  const handle = creator.handle.startsWith('@') ? creator.handle : `@${creator.handle}`;
  const size = 96;
  const padX = 26;
  const padY = 18;
  const text = Math.max(handle.length * 24, creator.name.length * 14) + 10;
  const w = padX * 2 + (photo ? size + 20 : 0) + text;
  const h = padY * 2 + size;
  return (
    <div style={{ position: 'absolute', left: PACK.composition.margin, top: 230 }}>
      <Rise i={0} from={6} kind="object">
        <div data-part="badge" style={{ position: 'relative', width: w, height: h, display: 'flex', alignItems: 'center', gap: 20, padding: `${padY}px ${padX}px`, ...cardStyle(w, h, 'dark') }}>
          {photo && (
            <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flex: 'none', boxShadow: `0 0 0 4px ${HERO}, 0 0 0 8px ${rgba(P.base, 0.6)}` }}>
              <Img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, whiteSpace: 'nowrap' }}>
            <Heavy size={44} colour={P.text}>{handle}</Heavy>
            <Label size={22} colour={P.textSoft}>{creator.name}</Label>
          </div>
        </div>
      </Rise>
    </div>
  );
};
