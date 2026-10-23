import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { glide, tw } from '../engine/motion';
import { MEASURE, PACK } from '../engine/style';
import { cardStyle } from '../kit/card';
import { CardDecor } from '../kit/CardDecor';
import { Ground, type Theme } from '../kit/Ground';
import { BAND, HalfBand, type Shoot } from '../kit/Presenter';
import { Rise } from '../kit/Rise';
import { groundOf, tones } from '../kit/tones';
import { Lead } from '../kit/Voices';

// The print scene: a screenshot the creator supplied (a DM, a review, a dashboard, a post) on a card of the pack's
// surface above the presenter in the half band, with an optional lead-in over it. The card takes the room between the
// top safe area and the band; a phone print stands tall in it, a wide one lies across it. The proof in someone else's
// pixels, where the quote scene is the proof in someone else's words.

export type PrintProps = {
  /** The image, in public/ (the creator's prints live in public/prints/). */
  src: string;
  /** The print's shape: a phone screenshot (tall), a desktop one (wide) or a square post. */
  shape?: 'phone' | 'wide' | 'square';
  /** A lead-in over the print, 2 to 5 words. */
  lead?: string;
  shoot?: Shoot;
  at?: number;
  theme?: Theme;
};

const PAD = 36;
const TOP = 150;

export const Print: React.FC<PrintProps> = ({ src, shape = 'phone', lead, shoot, at = 0, theme }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const g = groundOf(theme);
  const t = tones(g);
  // the room above the band (or the whole frame's upper part without a shoot), the card centred in it
  const foot = (shoot ? BAND.top : 1920 - PACK.subtitles.laneY / 2) - 48;
  const room = foot - TOP;
  const leadH = lead ? 64 : 0;
  const maxW = MEASURE - PAD * 2;
  const maxH = room - PAD * 2 - leadH;
  const ratio = shape === 'phone' ? 1.9 : shape === 'wide' ? 0.64 : 1;
  const imgW = Math.min(maxW, Math.floor(maxH / ratio));
  const imgH = Math.round(imgW * ratio);
  const w = Math.min(MEASURE, imgW + PAD * 2);
  const h = imgH + PAD * 2 + leadH;
  const top = Math.round(TOP + (room - h) / 2);
  const push = 1 + 0.03 * tw(f, 0, durationInFrames, glide);
  const inner = Math.max(6, PACK.cards[g].radius * 0.6);
  const file = /^(blob:|https?:|data:)/.test(src) ? src : staticFile(src);
  return (
    <AbsoluteFill>
      <Ground theme={g} />
      <div style={{ position: 'absolute', left: (1080 - w) / 2, top, width: w, transform: `scale(${push.toFixed(4)})`, transformOrigin: '50% 100%' }}>
        <Rise i={0} from={2} kind="object">
          <div data-part="card" style={{ position: 'relative', width: w, height: h, ...cardStyle(w, h, g) }}>
            <CardDecor w={w} h={h} theme={g} seed={23} />
            {lead && (
              <Rise i={1} from={4} style={{ position: 'absolute', left: PAD, right: PAD, top: PAD - 6, height: leadH, textAlign: 'center' }}>
                <Lead size={44} colour={t.soft}>{lead}</Lead>
              </Rise>
            )}
            <Rise i={lead ? 2 : 1} from={4} kind="object" style={{ position: 'absolute', left: PAD, top: PAD + leadH, width: imgW, height: imgH }}>
              <div data-part="print" style={{ width: imgW, height: imgH, borderRadius: inner, overflow: 'hidden', background: t.dark ? '#000' : '#FFF', boxShadow: `inset 0 0 0 2px ${t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` }}>
                <Img src={file} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
              </div>
            </Rise>
          </div>
        </Rise>
      </div>
      {shoot && <HalfBand shoot={shoot} at={at} top={BAND.top} />}
    </AbsoluteFill>
  );
};
