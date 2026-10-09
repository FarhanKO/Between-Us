import type { AvatarParams, Expression } from "./types";
import { PANTS_OUTFITS, SKIN_TONES, shade } from "./types";

const INK = "#2A1F26";

export type Pose = "front" | "side" | "drawing";

type Props = {
  params: AvatarParams;
  expression?: Expression;
  size?: number;
  /** Idle bob + blink. Off by default so static renders stay static. */
  animate?: boolean;
  /** "side" is a profile view drawn facing right (flip with CSS to face left);
   *  "drawing" is the front view holding a sketch pad and scribbling (used while a doodle replays). */
  pose?: Pose;
  /** Side pose only: run the walk cycle (legs + arm swing). */
  walking?: boolean;
  className?: string;
};

/**
 * Chibi avatar, 200x260 viewBox. Pure function of params + expression,
 * so it renders identically on the web, in the desktop pet, and server-side.
 */
export function Avatar({
  params,
  expression = "neutral",
  size = 200,
  animate = false,
  pose = "front",
  walking = false,
  className,
}: Props) {
  const skin = SKIN_TONES[params.skin];
  const hair = params.hairColor;
  const outfit = params.outfitColor;
  const sleeves = ["hoodie", "shirt_pants", "sweater_skirt", "suit", "kimono"].includes(params.outfit);

  if (pose === "side") {
    return (
      <svg
        viewBox="0 0 200 260"
        width={size}
        height={(size * 260) / 200}
        className={className}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        role="img"
        aria-label="avatar"
      >
        {(animate || walking) && (
          <style>{`
            @keyframes av-walk-bob { 0%,100% { transform: translateY(0) } 25%,75% { transform: translateY(-3px) } }
            @keyframes av-swing-a { 0%,100% { transform: rotate(-24deg) } 50% { transform: rotate(24deg) } }
            @keyframes av-swing-b { 0%,100% { transform: rotate(24deg) } 50% { transform: rotate(-24deg) } }
            @keyframes av-hair-sway { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(4deg) } }
            @keyframes av-blink { 0%,90%,100% { transform: scaleY(1) } 94% { transform: scaleY(0.08) } }
            .av-walk { animation: av-walk-bob 0.56s ease-in-out infinite; }
            .av-swing-a, .av-swing-b, .av-hair { transform-box: fill-box; transform-origin: 50% 0; }
            .av-swing-a { animation: av-swing-a 0.56s ease-in-out infinite; }
            .av-swing-b { animation: av-swing-b 0.56s ease-in-out infinite; }
            .av-hair { transform-origin: 80% 10%; animation: av-hair-sway 0.56s ease-in-out infinite; }
            .av-blink { transform-box: fill-box; transform-origin: center; animation: av-blink 4.5s ease-in-out infinite; }
          `}</style>
        )}
        <g className={walking ? "av-walk" : undefined}>
          <g className={walking ? "av-hair" : undefined}>
            <SideHairBack hair={params.hair} color={hair} />
          </g>
          <SideLeg x={92} skin={skin} outfit={params.outfit} outfitColor={shade(outfit, -0.1)} swing={walking ? "b" : undefined} back />
          <SideBody outfit={params.outfit} color={outfit} />
          <SideLeg x={101} skin={skin} outfit={params.outfit} outfitColor={outfit} swing={walking ? "a" : undefined} />
          <SideArm skin={skin} sleeves={sleeves} outfitColor={outfit} swing={walking ? "b" : undefined} />
          {/* neck */}
          <rect x="96" y="136" width="14" height="14" rx="4" fill={skin} />
          {/* head, slightly narrower in profile */}
          <ellipse cx="102" cy="92" rx="52" ry="52" fill={skin} />
          <SideFace expression={expression} blush={params.blush} animate={animate} />
          <SideHairFront hair={params.hair} color={hair} />
          <SideAccessory kind={params.accessory} color={params.accessoryColor} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={(size * 260) / 200}
      className={className}
      stroke={INK}
      strokeWidth={2.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      role="img"
      aria-label="avatar"
    >
      {animate && (
        <style>{`
          @keyframes av-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
          @keyframes av-blink { 0%,90%,100% { transform: scaleY(1) } 94% { transform: scaleY(0.08) } }
          .av-bob { animation: av-bob 2.6s ease-in-out infinite; }
          .av-blink { transform-box: fill-box; transform-origin: center; animation: av-blink 4.5s ease-in-out infinite; }
        `}</style>
      )}
      {pose === "drawing" && (
        <style>{`
          @keyframes av-scribble { 0%,100% { transform: translate(0,0) rotate(0deg) } 25% { transform: translate(-3px,2px) rotate(-4deg) } 50% { transform: translate(2px,-1px) rotate(3deg) } 75% { transform: translate(-1px,3px) rotate(-2deg) } }
          @keyframes av-draw { 0% { stroke-dashoffset: 120 } 70% { stroke-dashoffset: 0 } 100% { stroke-dashoffset: 0 } }
          .av-scribble { transform-box: fill-box; transform-origin: 20% 80%; animation: av-scribble 0.55s ease-in-out infinite; }
          .av-draw { stroke-dasharray: 120; animation: av-draw 2.4s ease-in-out infinite; }
        `}</style>
      )}
      <g className={animate ? "av-bob" : undefined}>
        <HairBack hair={params.hair} color={hair} />
        <Legs skin={skin} outfit={params.outfit} outfitColor={outfit} />
        <OutfitBody outfit={params.outfit} color={outfit} />
        {pose === "drawing" ? <DrawingArms skin={skin} sleeves={sleeves} outfitColor={outfit} /> : <Arms skin={skin} sleeves={sleeves} outfitColor={outfit} />}
        {/* neck */}
        <rect x="93" y="136" width="14" height="14" rx="4" fill={skin} />
        {/* ears */}
        <circle cx="45" cy="98" r="8" fill={skin} />
        <circle cx="155" cy="98" r="8" fill={skin} />
        {/* head */}
        <ellipse cx="100" cy="92" rx="56" ry="52" fill={skin} />
        <Face expression={expression} blush={params.blush} animate={animate} />
        <HairFront hair={params.hair} color={hair} />
        <AccessoryLayer kind={params.accessory} color={params.accessoryColor} />
      </g>
    </svg>
  );
}

/* ---------------------------------- hair ---------------------------------- */

function HairBack({ hair, color }: { hair: AvatarParams["hair"]; color: string }) {
  switch (hair) {
    case "long_bangs":
      return (
        <g fill={color}>
          <path d="M46 88 C36 130 40 176 52 194 C62 200 72 190 82 196 C92 202 100 190 110 196 C120 202 130 190 140 196 C150 200 156 190 152 176 C160 140 160 110 154 88 C148 46 128 32 100 32 C72 32 52 46 46 88 Z" />
          <path d="M60 70 C64 52 76 44 92 42" stroke="#fff" strokeOpacity="0.25" fill="none" />
        </g>
      );
    case "bob":
      return (
        <g fill={color}>
          <path d="M46 88 C40 118 42 140 54 154 C70 160 84 150 100 154 C116 150 130 160 146 154 C158 140 160 118 154 88 C148 46 128 32 100 32 C72 32 52 46 46 88 Z" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M48 88 C44 60 66 32 100 32 C134 32 156 60 152 88 Z" />
          <path d="M150 96 C170 100 176 126 166 156 C162 168 152 172 146 160 C140 146 144 120 142 104 Z" />
          <ellipse cx="146" cy="100" rx="7" ry="5" fill={shade(color, -0.35)} />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[
            [50, 70], [42, 96], [44, 122], [52, 146], [66, 160], [86, 166], [114, 166], [134, 160],
            [148, 146], [156, 122], [158, 96], [150, 70], [66, 48], [100, 38], [134, 48],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="15" />
          ))}
          <ellipse cx="100" cy="100" rx="58" ry="66" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

function HairFront({ hair, color }: { hair: AvatarParams["hair"]; color: string }) {
  switch (hair) {
    case "long_bangs":
    case "bob":
      // side-swept bangs with a soft scallop
      return (
        <path
          fill={color}
          d="M44 94 C44 52 66 34 100 34 C134 34 156 52 156 94 C152 84 148 78 142 86 C138 74 130 70 124 82 C118 68 108 68 100 80 C94 68 84 68 78 82 C72 72 64 76 60 88 C56 78 50 82 44 94 Z"
        />
      );
    case "ponytail":
      return (
        <path
          fill={color}
          d="M44 92 C44 52 66 34 100 34 C134 34 156 52 156 92 C150 78 142 72 132 84 C124 70 112 70 104 82 C98 70 88 70 82 82 C74 74 64 78 58 90 C52 82 48 86 44 92 Z"
        />
      );
    case "short":
      return (
        <g fill={color}>
          <path d="M44 96 C42 50 66 32 100 32 C134 32 158 50 156 96 C154 84 150 76 146 84 C144 70 136 66 130 78 C124 64 112 64 104 76 C98 64 86 64 80 76 C74 66 66 68 62 82 C56 74 50 80 44 96 Z" />
          <path d="M44 96 C40 104 42 114 46 118 L50 100 Z" />
          <path d="M156 96 C160 104 158 114 154 118 L150 100 Z" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[
            [56, 78], [72, 62], [92, 52], [112, 52], [130, 62], [146, 78], [64, 92], [136, 92],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="14" />
          ))}
          <path d="M50 88 C56 52 74 40 100 40 C126 40 144 52 150 88 Z" stroke="none" />
        </g>
      );
    case "buzz":
      return (
        <path
          fill={color}
          fillOpacity="0.85"
          d="M46 84 C48 50 70 36 100 36 C130 36 152 50 154 84 C136 74 118 70 100 70 C82 70 64 74 46 84 Z"
        />
      );
  }
}

/* ---------------------------------- body ---------------------------------- */

function Legs({ skin, outfit, outfitColor }: { skin: string; outfit: AvatarParams["outfit"]; outfitColor: string }) {
  const pants = PANTS_OUTFITS.includes(outfit);
  const shoe = shade(outfitColor, -0.15);
  return (
    <g>
      <rect x="85" y="200" width="13" height="42" rx="5" fill={pants ? shade(outfitColor, -0.55) : skin} />
      <rect x="102" y="200" width="13" height="42" rx="5" fill={pants ? shade(outfitColor, -0.55) : skin} />
      {!pants && (
        <>
          <rect x="85" y="226" width="13" height="10" fill="#fff" strokeWidth="0" />
          <rect x="102" y="226" width="13" height="10" fill="#fff" strokeWidth="0" />
        </>
      )}
      <ellipse cx="91" cy="244" rx="11" ry="6.5" fill={shoe} />
      <ellipse cx="109" cy="244" rx="11" ry="6.5" fill={shoe} />
    </g>
  );
}

function Arms({ skin, sleeves, outfitColor }: { skin: string; sleeves: boolean; outfitColor: string }) {
  const fill = sleeves ? outfitColor : skin;
  return (
    <g>
      <rect x="62" y="150" width="15" height="52" rx="7.5" fill={fill} />
      <rect x="123" y="150" width="15" height="52" rx="7.5" fill={fill} />
      {sleeves && (
        <>
          <circle cx="69.5" cy="200" r="7" fill={skin} />
          <circle cx="130.5" cy="200" r="7" fill={skin} />
        </>
      )}
    </g>
  );
}

// Front view, holding a small sketch pad in the left hand and scribbling with the right.
function DrawingArms({ skin, sleeves, outfitColor }: { skin: string; sleeves: boolean; outfitColor: string }) {
  const fill = sleeves ? outfitColor : skin;
  return (
    <g>
      {/* left upper arm + forearm across the body, holding the pad */}
      <rect x="62" y="150" width="15" height="30" rx="7.5" fill={fill} />
      <rect x="62" y="170" width="46" height="14" rx="7" fill={fill} />
      <circle cx="106" cy="177" r="7" fill={skin} />
      {/* sketch pad */}
      <g transform="rotate(-8 100 172)">
        <rect x="80" y="156" width="46" height="36" rx="4" fill="#fff9fb" stroke={INK} strokeWidth="2.5" />
        <rect x="80" y="156" width="46" height="6" rx="3" fill="#e74796" stroke="none" />
        <path className="av-draw" d="M88 176 c4 -8 8 -8 12 0 s8 8 12 0 s6 -6 8 -2" fill="none" stroke="#e74796" strokeWidth="2.5" />
      </g>
      {/* right upper arm, then the forearm + hand + pencil that wiggle */}
      <rect x="123" y="150" width="15" height="28" rx="7.5" fill={fill} />
      <g className="av-scribble">
        <rect x="104" y="166" width="32" height="14" rx="7" fill={fill} transform="rotate(-28 136 173)" />
        <circle cx="112" cy="163" r="7" fill={skin} />
        <line x1="112" y1="163" x2="102" y2="176" stroke="#f4b942" strokeWidth="4" />
        <line x1="102" y1="176" x2="99" y2="180" stroke={INK} strokeWidth="2.5" />
      </g>
    </g>
  );
}

function OutfitBody({ outfit, color }: { outfit: AvatarParams["outfit"]; color: string }) {
  const dark = shade(color, -0.3);
  const light = shade(color, 0.45);
  switch (outfit) {
    case "dress":
      return (
        <g>
          <path
            fill={color}
            d="M80 146 H120 Q125 146 126 151 L137 212 Q138 218 132 218 H68 Q62 218 63 212 L74 151 Q75 146 80 146 Z"
          />
          <rect x="70" y="176" width="60" height="7" fill={dark} strokeWidth="0" />
          {/* tiny bow motifs, like the reference */}
          <g fill={light} stroke="none">
            <path d="M92 164 l-4 -3 v6 z M92 164 l4 -3 v6 z" />
            <path d="M108 164 l-4 -3 v6 z M108 164 l4 -3 v6 z" />
          </g>
        </g>
      );
    case "tee_shorts":
      return (
        <g>
          <rect x="62" y="147" width="18" height="24" rx="6" fill={color} />
          <rect x="120" y="147" width="18" height="24" rx="6" fill={color} />
          <path fill={color} d="M78 146 H122 Q127 146 127 151 V190 Q127 195 122 195 H78 Q73 195 73 190 V151 Q73 146 78 146 Z" />
          <path fill={dark} d="M74 194 H126 V208 Q126 214 120 214 H80 Q74 214 74 208 Z" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path fill={color} d="M78 146 H122 Q128 146 128 152 V200 Q128 206 122 206 H78 Q72 206 72 200 V152 Q72 146 78 146 Z" />
          <path fill={dark} d="M76 148 Q100 128 124 148 Q100 156 76 148 Z" />
          <rect x="84" y="184" width="32" height="14" rx="5" fill={dark} />
          <path d="M94 150 V166 M106 150 V166" stroke={light} strokeWidth="2" />
        </g>
      );
    case "shirt_pants":
      return (
        <g>
          <path fill={color} d="M78 146 H122 Q127 146 127 151 V196 Q127 200 122 200 H78 Q73 200 73 196 V151 Q73 146 78 146 Z" />
          <path fill="#fff" d="M90 146 L100 158 L110 146 Z" />
          <circle cx="100" cy="168" r="2" fill={dark} strokeWidth="0" />
          <circle cx="100" cy="182" r="2" fill={dark} strokeWidth="0" />
        </g>
      );
    case "sweater_skirt":
      return (
        <g>
          {/* pleated skirt */}
          <path fill={dark} d="M76 186 H124 L132 216 Q132 219 128 219 H72 Q68 219 68 216 Z" />
          <path d="M86 188 L83 217 M100 188 V217 M114 188 L117 217" stroke={shade(color, -0.5)} strokeWidth="1.5" />
          {/* chunky sweater */}
          <path fill={color} d="M78 146 H122 Q128 146 128 152 V186 Q128 190 122 190 H78 Q72 190 72 186 V152 Q72 146 78 146 Z" />
          <path d="M80 186 H120" stroke={light} strokeWidth="3" strokeDasharray="3 3" />
          <path fill={light} d="M88 146 Q100 154 112 146 Z" stroke="none" />
        </g>
      );
    case "suit":
      return (
        <g>
          <path fill={color} d="M78 146 H122 Q128 146 128 152 V200 Q128 204 122 204 H78 Q72 204 72 200 V152 Q72 146 78 146 Z" />
          <path fill="#fff" d="M88 146 L100 176 L112 146 Z" stroke="none" />
          <path fill={dark} d="M88 146 L100 176 L94 152 Z M112 146 L100 176 L106 152 Z" stroke="none" />
          <path fill={shade(color, -0.55)} d="M97 152 L103 152 L104 172 L100 178 L96 172 Z" stroke="none" />
          <circle cx="100" cy="186" r="2" fill={dark} strokeWidth="0" />
        </g>
      );
    case "overalls":
      return (
        <g>
          {/* light shirt under the bib */}
          <path fill={light} d="M78 146 H122 Q127 146 127 151 V196 Q127 200 122 200 H78 Q73 200 73 196 V151 Q73 146 78 146 Z" />
          <rect x="86" y="146" width="6" height="30" fill={color} strokeWidth="0" />
          <rect x="108" y="146" width="6" height="30" fill={color} strokeWidth="0" />
          <path fill={color} d="M82 170 H118 Q124 170 124 176 V200 Q124 204 118 204 H82 Q76 204 76 200 V176 Q76 170 82 170 Z" />
          <rect x="92" y="178" width="16" height="12" rx="2" fill={dark} strokeWidth="0" />
          <circle cx="89" cy="173" r="2.2" fill={dark} strokeWidth="0" />
          <circle cx="111" cy="173" r="2.2" fill={dark} strokeWidth="0" />
        </g>
      );
    case "kimono":
      return (
        <g>
          <path fill={color} d="M76 146 H124 Q129 146 130 151 L136 214 Q137 219 131 219 H69 Q63 219 64 214 L70 151 Q71 146 76 146 Z" />
          {/* crossed collar */}
          <path fill={light} d="M86 146 L104 176 L108 146 Z" stroke="none" />
          <path fill={shade(color, 0.2)} d="M114 146 L100 172 L96 176 L92 146 Z" stroke="none" />
          {/* obi */}
          <rect x="70" y="178" width="60" height="12" fill={dark} strokeWidth="0" />
          <rect x="94" y="176" width="12" height="16" rx="2" fill={shade(color, -0.5)} strokeWidth="0" />
          <circle cx="118" cy="204" r="3" fill={light} stroke="none" />
          <circle cx="82" cy="200" r="2.5" fill={light} stroke="none" />
        </g>
      );
  }
}

/* ---------------------------------- face ---------------------------------- */

function Face({ expression, blush, animate }: { expression: Expression; blush: boolean; animate: boolean }) {
  return (
    <g>
      {blush && (
        <g fill="#F9A8D4" opacity="0.7" stroke="none">
          <ellipse cx="66" cy="113" rx="8" ry="4.5" />
          <ellipse cx="134" cy="113" rx="8" ry="4.5" />
        </g>
      )}
      <Eyes expression={expression} animate={animate} />
      <Mouth expression={expression} />
    </g>
  );
}

function RoundEye({ cx }: { cx: number }) {
  return (
    <g stroke="none">
      <ellipse cx={cx} cy="100" rx="6.5" ry="8.5" fill={INK} />
      <circle cx={cx + 2.5} cy="96.5" r="2.3" fill="#fff" />
    </g>
  );
}

function HappyEye({ cx }: { cx: number }) {
  return <path d={`M${cx - 8} 102 Q${cx} 90 ${cx + 8} 102`} fill="none" strokeWidth="3" />;
}

function Eyes({ expression, animate }: { expression: Expression; animate: boolean }) {
  switch (expression) {
    case "happy":
      return (
        <g>
          <HappyEye cx={80} />
          <HappyEye cx={120} />
        </g>
      );
    case "sad":
      return (
        <g>
          <g stroke="none">
            <ellipse cx="80" cy="102" rx="6" ry="7" fill={INK} />
            <ellipse cx="120" cy="102" rx="6" ry="7" fill={INK} />
            <circle cx="82" cy="99" r="2" fill="#fff" />
            <circle cx="122" cy="99" r="2" fill="#fff" />
          </g>
          {/* brows */}
          <path d="M70 90 L88 94 M130 90 L112 94" fill="none" strokeWidth="2.5" />
          {/* tear */}
          <path d="M126 110 q4 8 0 10 q-4 -2 0 -10 z" fill="#7DD3FC" stroke="none" />
        </g>
      );
    case "wink":
      return (
        <g>
          <g className={animate ? "av-blink" : undefined}>
            <RoundEye cx={80} />
          </g>
          <HappyEye cx={120} />
        </g>
      );
    case "sleepy":
      return (
        <g>
          <path d="M72 101 H88 M112 101 H128" fill="none" strokeWidth="3" />
          <text x="140" y="70" fontSize="16" fontWeight="700" fill={INK} stroke="none" fontFamily="sans-serif">
            z
          </text>
        </g>
      );
    case "love":
      return (
        <g fill="#E74796" stroke="none">
          <HeartEye cx={80} />
          <HeartEye cx={120} />
        </g>
      );
    case "surprised":
      return (
        <g>
          <g stroke="none">
            <ellipse cx="80" cy="100" rx="8" ry="10" fill="#fff" />
            <ellipse cx="120" cy="100" rx="8" ry="10" fill="#fff" />
            <ellipse cx="80" cy="101" rx="5" ry="6.5" fill={INK} />
            <ellipse cx="120" cy="101" rx="5" ry="6.5" fill={INK} />
            <circle cx="82" cy="98" r="1.8" fill="#fff" />
            <circle cx="122" cy="98" r="1.8" fill="#fff" />
          </g>
          {/* raised brows */}
          <path d="M70 84 Q80 78 90 84 M110 84 Q120 78 130 84" fill="none" strokeWidth="2.5" />
        </g>
      );
    case "laugh":
      return (
        <g>
          <HappyEye cx={80} />
          <HappyEye cx={120} />
          {/* tear of joy */}
          <path d="M132 104 q5 7 1 10 q-4 -3 -1 -10 z" fill="#7DD3FC" stroke="none" />
        </g>
      );
    case "angry":
      return (
        <g>
          <g stroke="none">
            <ellipse cx="80" cy="102" rx="6" ry="6.5" fill={INK} />
            <ellipse cx="120" cy="102" rx="6" ry="6.5" fill={INK} />
            <circle cx="82" cy="100" r="1.8" fill="#fff" />
            <circle cx="122" cy="100" r="1.8" fill="#fff" />
          </g>
          {/* brows slanting in */}
          <path d="M70 88 L90 95 M130 88 L110 95" fill="none" strokeWidth="3" />
        </g>
      );
    case "cry":
      return (
        <g>
          {/* squeezed-shut eyes */}
          <path d="M72 98 Q80 106 88 98 M112 98 Q120 106 128 98" fill="none" strokeWidth="3" />
          <path d="M70 92 L88 95 M130 92 L112 95" fill="none" strokeWidth="2.5" />
          {/* streaming tears */}
          <g fill="#7DD3FC" stroke="none">
            <path d="M74 106 q3 12 -1 22 q-4 -10 1 -22 z" />
            <path d="M126 106 q3 12 -1 22 q-4 -10 1 -22 z" />
          </g>
        </g>
      );
    case "shy":
      return (
        <g>
          {/* looking down and away */}
          <g stroke="none">
            <ellipse cx="80" cy="103" rx="6" ry="7.5" fill={INK} />
            <ellipse cx="120" cy="103" rx="6" ry="7.5" fill={INK} />
            <circle cx="78" cy="101" r="2" fill="#fff" />
            <circle cx="118" cy="101" r="2" fill="#fff" />
          </g>
          <g fill="#F9A8D4" opacity="0.85" stroke="none">
            <ellipse cx="66" cy="113" rx="9" ry="5" />
            <ellipse cx="134" cy="113" rx="9" ry="5" />
          </g>
          <path d="M60 110 l4 3 M64 108 l4 3 M132 110 l4 3 M136 108 l4 3" stroke="#E74796" strokeWidth="1.5" opacity="0.7" />
        </g>
      );
    case "smug":
      return (
        <g>
          {/* half-lidded */}
          <g stroke="none">
            <ellipse cx="80" cy="102" rx="6.5" ry="7" fill={INK} />
            <ellipse cx="120" cy="102" rx="6.5" ry="7" fill={INK} />
            <circle cx="83" cy="100" r="2" fill="#fff" />
            <circle cx="123" cy="100" r="2" fill="#fff" />
          </g>
          <path d="M72 97 H89 M111 97 H128" strokeWidth="5" stroke="#F8D9C4" strokeLinecap="butt" />
          <path d="M72 97 H89 M111 97 H128" fill="none" strokeWidth="2.5" />
        </g>
      );
    case "thinking":
      return (
        <g>
          {/* eyes up and to the side, one brow raised */}
          <g stroke="none">
            <ellipse cx="80" cy="100" rx="6.5" ry="8" fill={INK} />
            <ellipse cx="120" cy="100" rx="6.5" ry="8" fill={INK} />
            <circle cx="83" cy="95.5" r="2.3" fill="#fff" />
            <circle cx="123" cy="95.5" r="2.3" fill="#fff" />
          </g>
          <path d="M70 90 Q80 88 90 91 M110 86 Q120 80 130 84" fill="none" strokeWidth="2.5" />
        </g>
      );
    default:
      return (
        <g className={animate ? "av-blink" : undefined}>
          <RoundEye cx={80} />
          <RoundEye cx={120} />
        </g>
      );
  }
}

function HeartEye({ cx }: { cx: number }) {
  const cy = 100;
  return (
    <path
      d={`M${cx} ${cy + 8} C${cx - 12} ${cy} ${cx - 10} ${cy - 10} ${cx - 3} ${cy - 8} Q${cx} ${cy - 6} ${cx + 3} ${cy - 8} C${cx + 10} ${cy - 10} ${cx + 12} ${cy} ${cx} ${cy + 8} Z`}
    />
  );
}

function Mouth({ expression }: { expression: Expression }) {
  switch (expression) {
    case "happy":
      return (
        <g>
          <path d="M91 118 Q100 134 109 118 Z" fill="#7A2E3A" strokeWidth="2" />
          <ellipse cx="100" cy="127" rx="4" ry="2.5" fill="#F9A8D4" stroke="none" />
        </g>
      );
    case "sad":
      return <path d="M94 126 Q100 119 106 126" fill="none" strokeWidth="2.5" />;
    case "sleepy":
      return <ellipse cx="100" cy="123" rx="3" ry="3.5" fill="#7A2E3A" strokeWidth="2" />;
    case "love":
      return <path d="M92 119 Q100 130 108 119" fill="none" strokeWidth="2.5" />;
    case "surprised":
      return <ellipse cx="100" cy="124" rx="5" ry="6.5" fill="#7A2E3A" strokeWidth="2" />;
    case "laugh":
      return (
        <g>
          <path d="M88 117 Q100 138 112 117 Z" fill="#7A2E3A" strokeWidth="2" />
          <path d="M91 118 H109" stroke="#fff" strokeWidth="3" />
          <ellipse cx="100" cy="129" rx="5" ry="3" fill="#F9A8D4" stroke="none" />
        </g>
      );
    case "angry":
      return <path d="M93 124 H107" fill="none" strokeWidth="2.5" />;
    case "cry":
      return <path d="M92 124 Q96 120 100 124 Q104 128 108 124" fill="none" strokeWidth="2.5" />;
    case "shy":
      return <path d="M96 121 Q100 125 104 121" fill="none" strokeWidth="2.5" />;
    case "smug":
      return <path d="M93 122 Q100 126 109 118" fill="none" strokeWidth="2.5" />;
    case "thinking":
      return <path d="M95 122 Q100 122 105 120" fill="none" strokeWidth="2.5" />;
    default:
      return <path d="M94 120 Q100 126 106 120" fill="none" strokeWidth="2.5" />;
  }
}

/* ------------------------------- accessories ------------------------------ */

function AccessoryLayer({ kind, color }: { kind: AvatarParams["accessory"]; color: string }) {
  switch (kind) {
    case "clip":
      return (
        <rect x="126" y="54" width="28" height="9" rx="4.5" fill={color} transform="rotate(-30 140 58)" />
      );
    case "bow":
      return (
        <g fill={color}>
          <path d="M62 50 L44 38 L46 60 Z" />
          <path d="M62 50 L80 38 L78 60 Z" />
          <circle cx="62" cy="50" r="4.5" fill={shade(color, -0.3)} />
        </g>
      );
    case "glasses":
      return (
        <g fill="#fff" fillOpacity="0.12" strokeWidth="2.5">
          <circle cx="80" cy="100" r="14" />
          <circle cx="120" cy="100" r="14" />
          <path d="M94 100 H106 M66 98 L50 94 M134 98 L150 94" fill="none" />
        </g>
      );
    case "cap":
      return (
        <g fill={color}>
          <path d="M46 80 C46 44 70 28 100 28 C130 28 154 44 154 80 Z" />
          <path d="M38 80 H162 Q162 92 100 94 Q38 92 38 80 Z" fill={shade(color, -0.25)} />
          <circle cx="100" cy="28" r="4" />
        </g>
      );
    case "crown":
      return (
        <g fill="#F6C244" stroke={shade("#F6C244", -0.35)}>
          <path d="M70 52 L78 30 L90 46 L100 24 L110 46 L122 30 L130 52 Z" />
          <rect x="70" y="50" width="60" height="8" rx="2" />
          <circle cx="100" cy="30" r="3.5" fill={color} stroke="none" />
          <circle cx="80" cy="36" r="2.5" fill={color} stroke="none" />
          <circle cx="120" cy="36" r="2.5" fill={color} stroke="none" />
        </g>
      );
    case "headphones":
      return (
        <g fill={color}>
          <path d="M52 100 C52 52 148 52 148 100" fill="none" strokeWidth="6" stroke={color} />
          <rect x="42" y="88" width="16" height="28" rx="7" />
          <rect x="142" y="88" width="16" height="28" rx="7" />
          <rect x="46" y="94" width="8" height="16" rx="4" fill={shade(color, -0.35)} stroke="none" />
          <rect x="146" y="94" width="8" height="16" rx="4" fill={shade(color, -0.35)} stroke="none" />
        </g>
      );
    case "flower":
      return (
        <g fill={color} stroke="none">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="140" cy="46" rx="6" ry="9" transform={`rotate(${a} 140 56)`} />
          ))}
          <circle cx="140" cy="56" r="5" fill="#FDE68A" />
        </g>
      );
    case "scarf":
      return (
        <g fill={color}>
          <path d="M74 136 Q100 150 126 136 L128 150 Q100 164 72 150 Z" />
          <path d="M112 148 L124 184 L134 180 L124 146 Z" fill={shade(color, -0.2)} />
          <path d="M116 176 H132" stroke={shade(color, -0.45)} strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------ side view ------------------------------ */
// Drawn facing right. Hair trails to the left (behind), the visible eye sits near the front.

function SideHairBack({ hair, color }: { hair: AvatarParams["hair"]; color: string }) {
  switch (hair) {
    case "long_bangs":
      return (
        <g fill={color}>
          <path d="M60 80 C36 110 28 160 40 200 C50 208 60 196 70 202 C80 208 90 196 100 200 C112 204 124 196 130 186 C138 150 140 110 134 84 C124 44 100 32 84 34 C70 36 62 56 60 80 Z" />
          <path d="M62 78 C58 96 56 120 60 150" stroke="#fff" strokeOpacity="0.22" fill="none" />
        </g>
      );
    case "bob":
      return (
        <path fill={color} d="M60 84 C40 110 40 140 54 156 C70 160 90 150 110 156 C126 158 136 148 136 134 C138 110 138 90 132 84 C122 44 100 32 84 34 C70 36 62 56 60 84 Z" />
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M62 84 C58 60 74 34 104 34 C132 34 150 58 148 84 Z" />
          <path d="M58 96 C36 104 24 136 34 168 C38 180 50 182 56 168 C62 150 60 122 64 104 Z" />
          <ellipse cx="60" cy="100" rx="7" ry="5" fill={shade(color, -0.35)} />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[
            [56, 70], [44, 96], [42, 122], [48, 146], [62, 160], [84, 166], [108, 166], [128, 156], [138, 132],
            [140, 104], [134, 78], [72, 46], [100, 36], [126, 48],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="15" />
          ))}
          <ellipse cx="94" cy="104" rx="52" ry="64" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

function SideHairFront({ hair, color }: { hair: AvatarParams["hair"]; color: string }) {
  switch (hair) {
    case "long_bangs":
    case "bob":
    case "ponytail":
      // bangs sweep forward over the brow
      return (
        <path
          fill={color}
          d="M50 92 C50 52 70 34 102 34 C134 34 156 52 154 92 C152 80 146 74 138 82 C132 68 120 66 112 78 C104 66 90 66 84 80 C76 70 66 74 60 88 C54 82 50 86 50 92 Z"
        />
      );
    case "short":
      return (
        <g fill={color}>
          <path d="M50 96 C48 50 72 32 102 32 C134 32 158 50 154 96 C152 82 146 74 140 82 C134 66 122 64 114 76 C106 64 92 64 86 76 C78 66 68 68 62 82 C56 74 50 80 50 96 Z" />
          <path d="M50 96 C46 104 48 114 52 118 L56 100 Z" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[[60, 78], [76, 60], [98, 50], [120, 54], [138, 68], [150, 88], [66, 94]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="14" />
          ))}
          <path d="M56 88 C62 52 80 40 104 40 C128 40 146 52 150 88 Z" stroke="none" />
        </g>
      );
    case "buzz":
      return (
        <path
          fill={color}
          fillOpacity="0.85"
          d="M52 84 C54 50 74 36 102 36 C130 36 152 50 152 84 C136 74 118 70 102 70 C86 70 68 74 52 84 Z"
        />
      );
  }
}

function SideBody({ outfit, color }: { outfit: AvatarParams["outfit"]; color: string }) {
  const dark = shade(color, -0.3);
  const light = shade(color, 0.45);
  switch (outfit) {
    case "dress":
      return (
        <g>
          <path fill={color} d="M86 146 H118 Q123 146 124 151 L132 212 Q133 218 127 218 H77 Q71 218 72 212 L80 151 Q81 146 86 146 Z" />
          <rect x="78" y="176" width="48" height="7" fill={dark} strokeWidth="0" />
          <g fill={light} stroke="none">
            <path d="M104 164 l-4 -3 v6 z M104 164 l4 -3 v6 z" />
          </g>
        </g>
      );
    case "tee_shorts":
      return (
        <g>
          <path fill={color} d="M84 146 H120 Q125 146 125 151 V190 Q125 195 120 195 H84 Q79 195 79 190 V151 Q79 146 84 146 Z" />
          <path fill={dark} d="M80 194 H124 V208 Q124 214 118 214 H86 Q80 214 80 208 Z" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path fill={color} d="M84 146 H120 Q126 146 126 152 V200 Q126 206 120 206 H84 Q78 206 78 200 V152 Q78 146 84 146 Z" />
          <path fill={dark} d="M78 150 Q96 130 118 146 Q100 154 78 150 Z" />
          <rect x="92" y="184" width="26" height="14" rx="5" fill={dark} />
        </g>
      );
    case "shirt_pants":
      return (
        <g>
          <path fill={color} d="M84 146 H120 Q125 146 125 151 V196 Q125 200 120 200 H84 Q79 200 79 196 V151 Q79 146 84 146 Z" />
          <path fill="#fff" d="M110 146 L118 156 L124 146 Z" />
        </g>
      );
    case "sweater_skirt":
      return (
        <g>
          <path fill={dark} d="M82 186 H122 L128 216 Q128 219 124 219 H78 Q74 219 74 216 Z" />
          <path fill={color} d="M84 146 H120 Q126 146 126 152 V186 Q126 190 120 190 H84 Q78 190 78 186 V152 Q78 146 84 146 Z" />
          <path d="M84 186 H120" stroke={light} strokeWidth="3" strokeDasharray="3 3" />
        </g>
      );
    case "suit":
      return (
        <g>
          <path fill={color} d="M84 146 H120 Q126 146 126 152 V200 Q126 204 120 204 H84 Q78 204 78 200 V152 Q78 146 84 146 Z" />
          <path fill="#fff" d="M108 146 L116 168 L122 146 Z" stroke="none" />
          <path fill={shade(color, -0.55)} d="M114 150 L118 150 L118 166 L116 170 Z" stroke="none" />
        </g>
      );
    case "overalls":
      return (
        <g>
          <path fill={light} d="M84 146 H120 Q125 146 125 151 V196 Q125 200 120 200 H84 Q79 200 79 196 V151 Q79 146 84 146 Z" />
          <rect x="110" y="146" width="6" height="28" fill={color} strokeWidth="0" />
          <path fill={color} d="M86 170 H118 Q124 170 124 176 V200 Q124 204 118 204 H86 Q80 204 80 200 V176 Q80 170 86 170 Z" />
          <rect x="102" y="178" width="14" height="12" rx="2" fill={dark} strokeWidth="0" />
        </g>
      );
    case "kimono":
      return (
        <g>
          <path fill={color} d="M84 146 H118 Q123 146 124 151 L132 214 Q133 219 127 219 H77 Q71 219 72 214 L80 151 Q81 146 84 146 Z" />
          <path fill={light} d="M104 146 L118 174 L120 146 Z" stroke="none" />
          <rect x="78" y="178" width="48" height="12" fill={dark} strokeWidth="0" />
          <rect x="76" y="176" width="10" height="16" rx="2" fill={shade(color, -0.5)} strokeWidth="0" />
        </g>
      );
  }
}

function SideLeg({
  x,
  skin,
  outfit,
  outfitColor,
  swing,
  back = false,
}: {
  x: number;
  skin: string;
  outfit: AvatarParams["outfit"];
  outfitColor: string;
  swing?: "a" | "b";
  back?: boolean;
}) {
  const pants = PANTS_OUTFITS.includes(outfit);
  const legFill = pants ? shade(outfitColor, -0.55) : back ? shade(skin, -0.12) : skin;
  const shoe = shade(outfitColor, -0.15);
  return (
    <g className={swing ? `av-swing-${swing}` : undefined}>
      <rect x={x} y="200" width="13" height="42" rx="5" fill={legFill} />
      {!pants && <rect x={x} y="226" width="13" height="10" fill={back ? "#e8e8e8" : "#fff"} strokeWidth="0" />}
      {/* shoe points forward */}
      <path fill={shoe} d={`M${x - 2} 240 H${x + 22} Q${x + 28} 244 ${x + 22} 249 H${x - 2} Q${x - 8} 244 ${x - 2} 240 Z`} />
    </g>
  );
}

function SideArm({
  skin,
  sleeves,
  outfitColor,
  swing,
}: {
  skin: string;
  sleeves: boolean;
  outfitColor: string;
  swing?: "a" | "b";
}) {
  return (
    <g className={swing ? `av-swing-${swing}` : undefined}>
      <rect x="95" y="150" width="15" height="50" rx="7.5" fill={sleeves ? outfitColor : skin} />
      {sleeves && <circle cx="102.5" cy="198" r="7" fill={skin} />}
    </g>
  );
}

function SideFace({ expression, blush, animate }: { expression: Expression; blush: boolean; animate: boolean }) {
  const cx = 132;
  let eye: React.ReactNode;
  switch (expression) {
    case "happy":
    case "wink":
    case "laugh":
      eye = <path d={`M${cx - 8} 102 Q${cx} 90 ${cx + 8} 102`} fill="none" strokeWidth="3" />;
      break;
    case "love":
      eye = (
        <path
          fill="#E74796"
          stroke="none"
          d={`M${cx} 108 C${cx - 12} 100 ${cx - 10} 90 ${cx - 3} 92 Q${cx} 94 ${cx + 3} 92 C${cx + 10} 90 ${cx + 12} 100 ${cx} 108 Z`}
        />
      );
      break;
    case "surprised":
      eye = (
        <g stroke="none">
          <ellipse cx={cx} cy="100" rx="8" ry="10" fill="#fff" />
          <ellipse cx={cx} cy="101" rx="5" ry="6.5" fill={INK} />
          <circle cx={cx + 2} cy="98" r="1.8" fill="#fff" />
        </g>
      );
      break;
    case "angry":
      eye = (
        <g>
          <ellipse cx={cx} cy="102" rx="6" ry="6.5" fill={INK} stroke="none" />
          <path d={`M${cx - 10} 88 L${cx + 8} 95`} fill="none" strokeWidth="3" />
        </g>
      );
      break;
    case "cry":
      eye = (
        <g>
          <path d={`M${cx - 8} 98 Q${cx} 106 ${cx + 8} 98`} fill="none" strokeWidth="3" />
          <path d={`M${cx - 6} 106 q3 12 -1 22 q-4 -10 1 -22 z`} fill="#7DD3FC" stroke="none" />
        </g>
      );
      break;
    case "smug":
    case "thinking":
    case "shy":
      eye = (
        <g stroke="none">
          <ellipse cx={cx} cy="102" rx="6.5" ry="7" fill={INK} />
          <circle cx={cx + (expression === "shy" ? -2 : 3)} cy={expression === "thinking" ? 97 : 100} r="2" fill="#fff" />
          {expression === "smug" && <rect x={cx - 8} y="93" width="16" height="4" fill="#F8D9C4" />}
        </g>
      );
      break;
    case "sad":
      eye = (
        <g>
          <ellipse cx={cx} cy="102" rx="6" ry="7" fill={INK} stroke="none" />
          <circle cx={cx + 2} cy="99" r="2" fill="#fff" stroke="none" />
          <path d={`M${cx - 10} 90 L${cx + 8} 94`} fill="none" strokeWidth="2.5" />
        </g>
      );
      break;
    case "sleepy":
      eye = <path d={`M${cx - 8} 101 H${cx + 8}`} fill="none" strokeWidth="3" />;
      break;
    default:
      eye = (
        <g className={animate ? "av-blink" : undefined} stroke="none">
          <ellipse cx={cx} cy="100" rx="6.5" ry="8.5" fill={INK} />
          <circle cx={cx + 2.5} cy="96.5" r="2.3" fill="#fff" />
        </g>
      );
  }
  return (
    <g>
      {blush && <ellipse cx="124" cy="114" rx="8" ry="4.5" fill="#F9A8D4" opacity="0.7" stroke="none" />}
      {/* tiny nose bump on the profile */}
      <path d="M152 102 q5 4 0 9" fill="none" strokeWidth="2" />
      {eye}
      {expression === "happy" || expression === "laugh" ? (
        <path d="M138 118 Q146 128 152 118 Z" fill="#7A2E3A" strokeWidth="2" />
      ) : expression === "sad" || expression === "cry" ? (
        <path d="M140 124 Q146 119 152 124" fill="none" strokeWidth="2.5" />
      ) : expression === "surprised" ? (
        <ellipse cx="146" cy="123" rx="4" ry="5.5" fill="#7A2E3A" strokeWidth="2" />
      ) : expression === "angry" || expression === "thinking" ? (
        <path d="M140 123 H152" fill="none" strokeWidth="2.5" />
      ) : (
        <path d="M140 120 Q146 125 152 120" fill="none" strokeWidth="2.5" />
      )}
    </g>
  );
}

function SideAccessory({ kind, color }: { kind: AvatarParams["accessory"]; color: string }) {
  switch (kind) {
    case "clip":
      return <rect x="118" y="52" width="28" height="9" rx="4.5" fill={color} transform="rotate(-30 132 56)" />;
    case "bow":
      return (
        <g fill={color}>
          <path d="M72 50 L54 38 L56 60 Z" />
          <path d="M72 50 L90 38 L88 60 Z" />
          <circle cx="72" cy="50" r="4.5" fill={shade(color, -0.3)} />
        </g>
      );
    case "glasses":
      return (
        <g fill="#fff" fillOpacity="0.12" strokeWidth="2.5">
          <circle cx="132" cy="100" r="14" />
          <path d="M118 98 L70 92" fill="none" />
        </g>
      );
    case "cap":
      return (
        <g fill={color}>
          <path d="M52 80 C52 44 74 28 104 28 C134 28 156 44 156 80 Z" />
          <path d="M100 80 H172 Q176 88 160 92 L100 90 Z" fill={shade(color, -0.25)} />
          <circle cx="104" cy="28" r="4" />
        </g>
      );
    case "crown":
      return (
        <g fill="#F6C244" stroke={shade("#F6C244", -0.35)}>
          <path d="M74 52 L82 30 L94 46 L104 24 L114 46 L126 30 L134 52 Z" />
          <rect x="74" y="50" width="60" height="8" rx="2" />
          <circle cx="104" cy="30" r="3.5" fill={color} stroke="none" />
        </g>
      );
    case "headphones":
      return (
        <g fill={color}>
          <path d="M60 96 C60 52 148 52 148 96" fill="none" strokeWidth="6" stroke={color} />
          <rect x="58" y="86" width="16" height="28" rx="7" />
        </g>
      );
    case "flower":
      return (
        <g fill={color} stroke="none">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="70" cy="46" rx="6" ry="9" transform={`rotate(${a} 70 56)`} />
          ))}
          <circle cx="70" cy="56" r="5" fill="#FDE68A" />
        </g>
      );
    case "scarf":
      return (
        <g fill={color}>
          <path d="M80 136 Q104 150 126 136 L128 150 Q104 164 78 150 Z" />
          <path d="M84 148 L74 184 L64 180 L74 146 Z" fill={shade(color, -0.2)} />
        </g>
      );
    default:
      return null;
  }
}
