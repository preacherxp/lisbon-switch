/* Lisbon: two hills and the Tejo between them. Sets directly into the river at the mouth of the bridge. */
(() => {
  const { PAD_X, PAD_Y, BW, BH, BAYER, clamp, mix, smooth, rng } = CitySwitch;

  // The ground is three lines. Everything that stands or walks asks these.
  const SL = (x) => Math.round(58 + (x + 20) * 0.4); // tram street, climbing to the left
  const SR = (x) => Math.round(100 - (x - 205) * 0.4); // the neon street, climbing to the right
  const FG = (x) => Math.round(x < 120 ? 128 - (120 - x) * 0.06 : x > 200 ? 128 - (x - 200) * 0.06 : 128);
  const BY = (x) => Math.round(124 - (58 - x) * 0.85); // the Bica, far steeper than anything else

  const HORIZON = 90;
  const WATER_END = 120;
  const TOWERS = [148, 186];
  const DECK = 70;
  const TOWER_TOP = 48;
  const SUN_X = 167;

  let M, N;
  // How much light each painted colour throws back at a street lamp
  const LUM = [];

  const TILES = {
    lattice: ['#..#', '.##.', '.##.', '#..#'],
    cross: ['.#..', '###.', '.#..', '....'],
    star: ['#.#', '.#.', '#.#'],
    pombal: ['##..', '##..', '..##', '..##'],
    leaf: ['#...', '.#.#', '..#.', '.#.#'],
  };

  const GUITAR = [
    '....#######......................',
    '..##.......###..................#',
    '.#............##..............#.#',
    '#....###........##..........#..##',
    '#...#...#.........#########.#####',
    '#...#...#........................',
    '#...#...#.........#########.#####',
    '#....###........##..........#..##',
    '.#............##..............#.#',
    '..##.......###..................#',
    '....#######......................',
  ];

  // Tail of the neon sardine, two beats
  const TAIL = [
    ['#.....', '.#...#', '..#.#.', '...#..', '...#..', '..#.#.', '.#...#', '#.....'],
    ['...#..', '...##.', '..#.#.', '..#..#', '..#..#', '..#.#.', '...##.', '...#..'],
  ];

  const scene = {
    city: 'Lisbon',
    label: 'Dark mode',
    tube: ['#ffc61a', '#1f7dff'],
    body: ['#efe6d4', '#0c1120'],
    glass: 'clear',
    sky: [
      ['#2a7fd4', '#3f95df', '#62ade8', '#a3d2f0', '#f4f6ee'],
      ['#5a86b8', '#d8aa80', '#f8a858', '#ffae4c', '#ffd468'],
      ['#2a4684', '#b05c74', '#ec6466', '#ff7c4a', '#ffae52'],
      ['#06122a', '#0a1a36', '#102544', '#1a3050', '#2f3f58'],
      ['#264682', '#6a7aa8', '#d59c9e', '#f8bd90', '#ffe2b0'],
    ],
    // Gold lasts more than twice as long here, and the fall to night is short
    keys: [
      [12, 0],
      [14.4, 0],
      [16.2, 1],
      [18.5, 1],
      [19.2, 2],
      [20.3, 3],
      [28.6, 3],
      [29.8, 4],
      [31.4, 0],
      [36, 0],
    ],
    grade: [
      ([r, g, b]) => [r, g, b],
      ([r, g, b]) => [r * 1.05 + 0.03, g * 0.8 + 0.01, b * 0.56],
      ([r, g, b]) => [r * 0.64 + 0.07, g * 0.42 + 0.02, b * 0.46 + 0.05],
      ([r, g, b]) => [r * 0.2 + 0.025, g * 0.22 + 0.035, b * 0.34 + 0.07],
      ([r, g, b]) => [r * 0.7 + 0.05, g * 0.58 + 0.03, b * 0.62 + 0.06],
    ],
    dark: (h) => smooth(18.5, 20, h) * (1 - smooth(28.7, 30.2, h)),
    weather: () => ({ rain: 0, snow: 0, wet: 0, glass: 0 }),
    // Three pixels wide, a V and a U are the same letter unless the V closes early
    glyphs: {
      V: ['#.#', '#.#', '#.#', '.#.', '.#.'],
      G: ['.###', '#...', '#.##', '#..#', '.###'],
    },
    street: (M) => [M.CALC_W, M.CALC_W2, M.CALC_K, M.CALC_K2],

    palette(ctx) {
      const { mat, neon, rgb, GOLD, DUSK, NIGHT, DAWN } = ctx;
      M = ctx.M;
      N = ctx.N;
      const m = (name, hex, over) => {
        mat(name, hex, over);
        const [r, g, b] = rgb(hex);
        LUM[M[name]] = r * 0.3 + g * 0.55 + b * 0.15;
      };
      // Engine colours whose night and dusk lean violet
      mat('CLOUD', '#ffffff', { [GOLD]: '#ffdca8', [DUSK]: '#ff9a7a', [NIGHT]: '#1d2c48', [DAWN]: '#ffcdb4' });
      mat('CLOUD_SH', '#dbe9f2', { [GOLD]: '#f4a878', [DUSK]: '#c8605f', [NIGHT]: '#16233c', [DAWN]: '#dc9c9e' });
      mat('WIRE', '#30343a', { [GOLD]: '#402a26', [NIGHT]: '#070c18' });
      mat('TUBE', '#b8b8ae', { [NIGHT]: '#26304a' });
      mat('WALK_D', '#8a8474', { [NIGHT]: '#080d1a' });
      mat('SMOKE', '#f4f1ea', { [GOLD]: '#ffe2c0', [DUSK]: '#e0a48c', [NIGHT]: '#5a6276' });
      mat('GLASS', '#4d7fa6', { [GOLD]: '#ffbe62', [DUSK]: '#ef8a62', [NIGHT]: '#101a30', [DAWN]: '#d99a90' });
      mat('GLASS_HI', '#9cc8dc', { [GOLD]: '#ffe6a4', [DUSK]: '#ffb684', [NIGHT]: '#18243e', [DAWN]: '#f2c0a8' });
      mat('GLASS_DK', '#3a5f80', { [GOLD]: '#d98a48', [DUSK]: '#b0604e', [NIGHT]: '#0b1426', [DAWN]: '#a87480' });
      // Far things are bluer the further they go, and go dark before the near ones
      mat('FAR_A', '#a8c6da', { [GOLD]: '#d7936a', [DUSK]: '#94525e', [NIGHT]: '#101d34', [DAWN]: '#9a8a9c' });
      mat('FAR_B', '#88aabc', { [GOLD]: '#a86e58', [DUSK]: '#6a3a4c', [NIGHT]: '#0c1729', [DAWN]: '#7c6e84' });
      mat('FAR_C', '#b9d0da', { [GOLD]: '#c8846a', [DUSK]: '#7c4654', [NIGHT]: '#16243c', [DAWN]: '#a89aa6' });
      mat('RIVER', '#3a8cc0', { [GOLD]: '#dc8d4a', [DUSK]: '#bb5f58', [NIGHT]: '#0a1a32', [DAWN]: '#bb8e94' });
      mat('RIVER_D', '#2f7bb0', { [GOLD]: '#c47338', [DUSK]: '#9c4c50', [NIGHT]: '#08162c', [DAWN]: '#a47c88' });
      mat('RIVER_L', '#5ba2cf', { [GOLD]: '#f2a55c', [DUSK]: '#d67860', [NIGHT]: '#10223c', [DAWN]: '#d4a4a0' });
      mat('RED', '#cf3b20', { [GOLD]: '#8c2c1c', [DUSK]: '#54202c', [NIGHT]: '#2e1824', [DAWN]: '#a03e34' });
      mat('RED_D', '#a42c18', { [GOLD]: '#6a2018', [DUSK]: '#401a26', [NIGHT]: '#22121e', [DAWN]: '#7c3030' });
      mat('CRISTO', '#e0d9c6', { [GOLD]: '#8a5444', [DUSK]: '#512f40', [NIGHT]: '#1a2438', [DAWN]: '#b09a98' });

      // Tiles and walls
      m('AZ_W', '#eff1ea');
      m('AZ_B', '#2d68c6');
      m('AZ_G', '#28906a');
      m('AZ_Y', '#d9a228');
      m('AZ_T', '#1f8c9c');
      m('LIME', '#f4ecd8');
      m('LIME_D', '#d7cdb4');
      m('PINK', '#eba79a');
      m('PINK_D', '#cf8a7e');
      m('OCRE', '#ebba58');
      m('OCRE_D', '#cc9a40');
      m('ROSE', '#d4685c');
      m('ROSE_D', '#b45248');
      m('SAGE', '#9fc0a0');
      m('SAGE_D', '#82a486');
      m('SKY_P', '#94bddd');
      m('SKY_D', '#769fc0');
      m('FRAME', '#faf6ea');
      m('STONE', '#d4c9b0');
      m('STONE_D', '#a99c84');
      m('STONE_K', '#8a7e6a');
      m('CAST', '#c8bda2');
      m('CAST_D', '#a59a80');
      m('TER', '#cb6238');
      m('TER_D', '#a44b2a');
      m('TER_L', '#e08354');
      // Street
      m('CALC_W', '#ece7d8', { [NIGHT]: '#414e66' });
      m('CALC_W2', '#dcd6c4', { [NIGHT]: '#384560' });
      m('CALC_K', '#35343a', { [NIGHT]: '#0a1020' });
      m('CALC_K2', '#46454a', { [NIGHT]: '#0e1526' });
      m('COB', '#9c917f', { [NIGHT]: '#1c2436' });
      m('COB_D', '#857a69', { [NIGHT]: '#161d2e' });
      m('COB_L', '#b2a795', { [NIGHT]: '#242c40' });
      m('STEP', '#e4dcc8', { [NIGHT]: '#2f3a52' });
      m('STEEL_R', '#54565a', { [NIGHT]: '#2a3246' });
      m('STEEL_S', '#d6d6d0', { [NIGHT]: '#5a6880' });
      m('IRON', '#20232a', { [GOLD]: '#2a1c1c', [NIGHT]: '#070b16' });
      m('IRON_L', '#3a3e48', { [GOLD]: '#40282a', [NIGHT]: '#121a2a' });
      m('DARK_W', '#2b2a30', { [NIGHT]: '#0a0e1c' });
      // Tram
      m('TRAM_Y', '#f8c612', { [NIGHT]: '#8e7024' });
      m('TRAM_Y2', '#d6a40c', { [NIGHT]: '#6c5420' });
      m('TRAM_W', '#f8f0dc', { [NIGHT]: '#72809a' });
      m('TRAM_R', '#77726a', { [NIGHT]: '#2a3244' });
      m('TRAM_K', '#26242a', { [NIGHT]: '#0a0e1a' });
      // Life
      m('LEAF', '#4c8e44', { [NIGHT]: '#10283a' });
      m('LEAF_D', '#356c38', { [NIGHT]: '#0a1c2c' });
      m('LEAF_L', '#74ae58', { [NIGHT]: '#183444' });
      m('BOUG', '#d8368a', { [NIGHT]: '#3a1a3a' });
      m('GERAN', '#e23c30');
      m('GULL', '#fbfbf6', { [NIGHT]: '#7c8ca6' });
      m('GULL_D', '#6c7480', { [NIGHT]: '#2e3a50' });
      m('BLACK', '#1c1a1e', { [NIGHT]: '#070a14' });
      m('GREY_H', '#d0cdc6', { [NIGHT]: '#6c7486' });
      m('TOUR_A', '#e8604c', { [NIGHT]: '#a04a44' });
      m('TOUR_B', '#2ea4a8', { [NIGHT]: '#2c6e80' });
      m('TOUR_C', '#f0d24a', { [NIGHT]: '#a08c40' });
      m('SHORTS', '#c0ae88', { [NIGHT]: '#5a5a66' });
      m('JEAN', '#3d5f8e', { [NIGHT]: '#26406a' });
      m('FERRY_O', '#ee7a1c', { [NIGHT]: '#6a3a24' });
      m('TUK_G', '#1ea06c', { [NIGHT]: '#26705e' });
      m('TUK_R', '#e0352c', { [NIGHT]: '#8c3030' });
      m('BUNT_R', '#e8352c', { [NIGHT]: '#7c2830' });
      m('BUNT_Y', '#f8cc20', { [NIGHT]: '#907a2c' });
      m('BUNT_G', '#2ca85c', { [NIGHT]: '#1f6450' });
      m('BUNT_B', '#2c7ce0', { [NIGHT]: '#26508c' });
      m('BUNT_P', '#f06aa8', { [NIGHT]: '#8c4070' });
      m('SHEET', '#fbf8ee', { [NIGHT]: '#5c6880' });
      m('SHEET_S', '#dcdccc', { [NIGHT]: '#465268' });
      m('SARD_S', '#d5e2e6', { [GOLD]: '#ecc09a', [NIGHT]: '#0e1a2c' });
      m('SARD_D', '#2b6c9c', { [GOLD]: '#7a5a60', [NIGHT]: '#0a1424' });
      mat('TUBE_K', '#1c3a56', { [NIGHT]: '#26304a' });
      mat('FLAG_G', '#1c8c44');
      mat('FLAG_R', '#d8261c');

      // Amber street lamps on stone, six steps of how lit
      ['#2f2422', '#4c3226', '#70482c', '#9c6a34', '#cc9448', '#f2c070'].forEach((c, i) => neon(`AMB${i + 1}`, c, '#ff9a30', 0.03 + i * 0.022));
      neon('LAMP', '#fff0c0', '#ffa030', 0.85);
      neon('TRAM_LIT', '#ffd68a', '#ffa030', 0.34);
      neon('BULB', '#ffe6a8', '#ffb040', 0.7);
      neon('BRIDGE_L', '#ffdc9a', '#ff9a30', 0.5);
      neon('CRISTO_L', '#ffeed0', '#ffc070', 0.26);
      neon('CRISTO_D', '#c8a888', '#a07040', 0.1);
      neon('FADO_ROOM', '#ffae5c', '#ff7a24', 0.3);
      neon('SUN_A', '#ffedb0', '#ffa83c', 0.5);
      neon('SUN_B', '#ffba5a', '#ff7a1c', 0.8);
      neon('SUN_C', '#ff8a3a', '#ff4a10', 0.9);
      neon('SUN_D', '#ff5f2c', '#ff3008', 0.9);
    },

    build(w, ctx) {
      const { FONT3, FONT5 } = ctx;
      const r = rng(1755);
      w.walkTop = 128;
      w.roadTop = 128;
      w.noSignal = true;
      w.depth = 0;

      w.myWin = [];
      for (let i = 0; i < 24; i++) w.myWin.push(w.addGroup(18.5 + r() * 1.6, 23.5 + r() * 5, 'room'));
      const sign = () => w.addGroup(18.8 + r() * 1.1, 27.4 + r() * 1.4);
      const shop = w.addGroup(18.3, 29.4, 'room');

      const plain = (mt, dk, band) => ({ plain: mt, dk, band });
      const tile = (pat, ink, dk = M.STONE_D) => ({ pat: TILES[pat], ink, ground: M.AZ_W, dk });
      const BAND = (pat, ink, h = 8) => ({ pat: TILES[pat], ink, h });
      const SKIN = {
        azul: tile('lattice', M.AZ_B),
        cruz: tile('cross', M.AZ_B),
        verde: tile('star', M.AZ_G),
        mostarda: tile('pombal', M.AZ_Y),
        folha: tile('leaf', M.AZ_T),
        rosa: plain(M.PINK, M.PINK_D, BAND('cross', M.AZ_B)),
        ocre: plain(M.OCRE, M.OCRE_D, BAND('lattice', M.AZ_B)),
        cal: plain(M.LIME, M.LIME_D, BAND('star', M.AZ_G)),
        vinho: plain(M.ROSE, M.ROSE_D, BAND('pombal', M.AZ_Y)),
        salvia: plain(M.SAGE, M.SAGE_D, BAND('leaf', M.AZ_B)),
        ceu: plain(M.SKY_P, M.SKY_D, BAND('cross', M.AZ_B)),
      };

      const tiled = (x, y, W, H, pat, ink, ground) => {
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < W; i++) {
            const row = pat[(y + j + 400) % pat.length];
            w.px(x + i, y + j, row[(x + i + 400) % row.length] === '#' ? ink : ground);
          }
        }
      };
      const facade = (x, y, W, H, skin, bandAt) => {
        if (skin.pat) tiled(x, y, W, H, skin.pat, skin.ink, skin.ground);
        else {
          w.rect(x, y, W, H, skin.plain);
          if (skin.band && bandAt !== undefined) {
            tiled(x, bandAt - skin.band.h, W, H - (bandAt - skin.band.h - y), skin.band.pat, skin.band.ink, M.AZ_W);
            w.rect(x, bandAt - skin.band.h - 1, W, 1, M.FRAME);
          }
        }
        w.rect(x + W - 1, y, 1, H, skin.dk);
      };

      const roof = (x, y, W, H = 4, chimney = -1) => {
        for (let j = 0; j < H; j++) {
          for (let i = j; i < W - j; i++) {
            const mt = (i + j * 2) % 3 === 0 ? M.TER_L : j === 0 ? M.TER_D : (i + j) % 5 === 0 ? M.TER_D : M.TER;
            w.px(x + i, y - 1 - j, mt);
          }
        }
        w.rect(x, y, W, 1, M.TER_D);
        if (chimney >= 0) {
          w.rect(x + chimney, y - H - 3, 2, 4, M.LIME);
          w.rect(x + chimney + 1, y - H - 2, 1, 3, M.LIME_D);
          w.rect(x + chimney - 1, y - H - 4, 4, 1, M.TER_D);
        }
      };

      const windowAt = (x, y, W = 3, H = 5, opts = {}) => {
        w.rect(x - 1, y - 1, W + 2, H + 1, M.FRAME);
        w.rect(x, y, W, H, M.GLASS);
        w.rect(x, y, W, 1, M.GLASS_HI);
        if (W > 2) w.rect(x + Math.floor(W / 2), y, 1, H, M.GLASS_DK);
        const seed = (x * 13 + y * 7) % 10;
        if (opts.lit ?? seed < 6) {
          w.lightRect(x, y, W, H, seed % 4 === 0 ? N.WARM_DIM : N.WARM, w.myWin[(x * 3 + y) % w.myWin.length]);
          if (W > 2) w.rect(x + Math.floor(W / 2), y, 1, H, M.GLASS_DK);
        }
        if (opts.balcony) {
          w.rect(x - 2, y + H - 2, W + 4, 1, M.IRON);
          for (let i = -2; i < W + 2; i += 2) w.px(x + i, y + H - 1, M.IRON);
          w.rect(x - 2, y + H, W + 4, 1, M.STONE_D);
          if (opts.flowers) {
            w.px(x - 1, y + H - 3, M.GERAN);
            w.px(x + W, y + H - 3, M.GERAN);
            w.px(x + 1, y + H - 3, M.LEAF);
          }
        } else w.rect(x - 1, y + H, W + 2, 1, M.STONE_D);
      };

      const door = (x, base, W = 5, H = 8) => {
        w.rect(x - 1, base - H - 1, W + 2, H + 1, M.STONE);
        w.rect(x, base - H, W, H, M.WOOD_DK);
        w.rect(x, base - H, W, 2, M.GLASS_DK);
        if ((x + base) % 3) w.lightRect(x, base - H, W, 2, N.WARM, w.myWin[(x + base) % w.myWin.length]);
        w.rect(x + Math.floor(W / 2), base - H + 2, 1, H - 2, M.WOOD);
      };

      // Terraces: a house stands on the higher side of its plot and runs on down, the street paints over the rest
      const house = ({ x, w: W, base, h, skin, floors = 2, chimney = -1, balcony = true }) => {
        const top = base - h;
        facade(x, top, W, h + 26, skin, base);
        w.rect(x, top, W, 1, M.FRAME);
        roof(x - 1, top, W + 2, 4, chimney);
        const fh = Math.floor((h - 10) / floors);
        const n = Math.max(1, Math.floor((W - 4) / 7));
        const gap = (W - n * 3) / (n + 1);
        for (let f = 0; f < floors; f++) {
          for (let i = 0; i < n; i++) {
            const wx = Math.round(x + gap + i * (3 + gap));
            const wy = top + 2 + f * fh;
            windowAt(wx, wy, 3, Math.min(6, fh - 3), { balcony: balcony && (f + i) % 2 === 0, flowers: (wx + f) % 3 === 0 });
          }
        }
      };

      // ---- River, far bank, bridge
      for (let y = HORIZON; y < WATER_END + 8; y++) {
        let x = -40;
        while (x < 360) {
          const run = 3 + Math.floor(r() * (6 + (y - HORIZON) * 0.8));
          const pick = r();
          w.rect(x, y, run, 1, pick < 0.2 ? M.RIVER_D : pick < 0.3 ? M.RIVER_L : M.RIVER);
          x += run;
        }
      }
      const almada = (x) => HORIZON - Math.round(15 * (1 - smooth(136, 166, x)) * smooth(90, 110, x) + Math.sin(x * 0.7) * 0.8);
      for (let x = 90; x < 168; x++) {
        const top = almada(x);
        for (let y = top; y < HORIZON; y++) w.px(x, y, y < top + 1 ? M.FAR_C : M.FAR_B);
        if (x % 4 === 1 && top < HORIZON - 3) {
          w.px(x, top + 2, M.FAR_C);
          if ((x * 5) % 3) w.light(x, top + 2, N.WARM_DIM, w.farWin[x % 5]);
        }
      }
      for (let x = 194; x < 240; x++) {
        const top = HORIZON - 4 - Math.round(Math.sin(x * 0.5) * 0.9);
        for (let y = top; y < HORIZON; y++) w.px(x, y, M.FAR_A);
        if (x % 3 === 0) w.light(x, top + 1, N.WARM_DIM, w.farWin[x % 5]);
      }

      // Cristo Rei on its portal plinth, on the south bank at the end of the bridge
      const cx = 136;
      const cg = w.addGroup(18.9, 28.6, 'room');
      const plinth = (x, y, m, lit) => {
        w.px(x, y, m);
        w.light(x, y, lit, cg);
      };
      for (let y = 57; y < 77; y++) {
        const leg = y > 66;
        for (let i = -3; i <= 3; i++) {
          if (leg && Math.abs(i) < 2) continue;
          if (!leg && Math.abs(i) > 2) continue;
          plinth(cx + i, y, M.CRISTO, i > 0 ? N.CRISTO_D : N.CRISTO_L);
        }
      }
      for (let i = -4; i <= 4; i++) plinth(cx + i, 56, M.CRISTO, N.CRISTO_L);
      for (let y = 47; y < 56; y++) for (let i = -1; i <= 1; i++) plinth(cx + i, y, M.CRISTO, i > 0 ? N.CRISTO_D : N.CRISTO_L);
      for (let i = -6; i <= 6; i++) plinth(cx + i, 48, M.CRISTO, N.CRISTO_L);
      plinth(cx, 46, M.CRISTO, N.CRISTO_L);
      plinth(cx, 45, M.CRISTO, N.CRISTO_L);
      plinth(cx - 1, 46, M.CRISTO, N.CRISTO_L);
      plinth(cx + 1, 46, M.CRISTO, N.CRISTO_D);

      const mid = (TOWERS[0] + TOWERS[1]) / 2;
      const half = (TOWERS[1] - TOWERS[0]) / 2;
      const bridgeLights = w.addGroup(18.8, 28.8, 'neon', { soft: true });
      const tower = (tx) => {
        for (let y = TOWER_TOP; y < HORIZON; y++) {
          w.px(tx - 1, y, M.RED);
          w.px(tx + 2, y, M.RED_D);
          // The bridge's towers are open steel lattice
          if ((y - TOWER_TOP) % 7 === 0) {
            w.px(tx, y, M.RED);
            w.px(tx + 1, y, M.RED);
          } else if ((y - TOWER_TOP) % 7 === 3 || (y - TOWER_TOP) % 7 === 4) w.px(tx + ((y - TOWER_TOP) % 7) - 3, y, M.RED_D);
        }
        w.rect(tx - 2, TOWER_TOP - 1, 6, 2, M.RED);
        w.rect(tx - 2, HORIZON - 2, 6, 3, M.STONE_D);
        w.beacons.push([tx, TOWER_TOP - 2]);
        w.beacons.push([tx + 1, TOWER_TOP - 2]);
      };
      const cableY = (x) => TOWER_TOP + (DECK - 3 - TOWER_TOP) * (1 - ((x - mid) / half) ** 2);
      for (let x = TOWERS[0]; x <= TOWERS[1]; x++) {
        const y = Math.round(cableY(x));
        w.px(x, y, M.RED_D);
        if (x % 2 === 0) for (let j = y + 1; j < DECK; j++) if (x % 4 === 0 || j > y + 3) w.pxSky(x, j, M.RED_D);
      }
      for (let x = 128; x < TOWERS[0]; x++) {
        const y = Math.round(mix(DECK - 2, TOWER_TOP, ((x - 128) / (TOWERS[0] - 128)) ** 1.4));
        w.pxSky(x, y, M.RED_D);
        if (x % 3 === 0) for (let j = y; j < DECK; j++) w.pxSky(x, j, M.RED_D);
      }
      for (let x = TOWERS[1] + 2; x < 226; x++) {
        const y = Math.round(mix(TOWER_TOP, DECK - 2, ((x - TOWERS[1] - 2) / 38) ** 0.8));
        w.px(x, y, M.RED_D);
        if (x % 3 === 0) for (let j = y; j < DECK; j++) w.px(x, j, M.RED_D);
      }
      for (let x = 126; x < 230; x++) {
        w.px(x, DECK, M.RED);
        w.px(x, DECK + 1, M.RED_D);
        if (x % 2 === 0) w.px(x, DECK + 2, M.RED_D);
        if (x % 3 === 0) w.light(x, DECK, N.BRIDGE_L, bridgeLights);
      }
      tower(TOWERS[0]);
      tower(TOWERS[1]);

      // ---- Left hill, back row: the castle over the roofs, a cathedral front beside it
      w.depth = 1;
      const castle = (x, top, W, tall) => {
        w.rect(x, top, W, tall, M.CAST);
        w.rect(x + W - 2, top, 2, tall, M.CAST_D);
        for (let i = 0; i < W; i += 3) w.rect(x + i, top - 2, 2, 2, M.CAST);
      };
      castle(52, 36, 34, 40);
      castle(60, 26, 12, 20);
      castle(40, 30, 12, 26);
      castle(82, 44, 8, 30);
      for (let y = 40; y < 74; y += 3) for (let x = 53 + (y % 2) * 3; x < 86; x += 6) w.px(x, y, M.CAST_D);
      w.px(64, 32, M.DARK_W);
      w.px(64, 33, M.DARK_W);
      w.px(68, 32, M.DARK_W);
      w.px(68, 33, M.DARK_W);
      w.flagAt = [65, 22];

      // Two square towers, the Sé
      const se = (x) => {
        w.rect(x, 22, 8, 30, M.LIME_D);
        w.rect(x + 7, 22, 1, 30, M.STONE_D);
        for (let i = 0; i < 8; i += 2) w.px(x + i, 21, M.LIME_D);
        w.rect(x + 3, 26, 2, 4, M.DARK_W);
      };
      se(12);
      se(28);
      w.rect(20, 28, 8, 24, M.LIME);
      w.rect(23, 32, 2, 2, M.AZ_B);
      for (const [x, W, top, skin] of [
        [-40, 26, 2, SKIN.ocre],
        [-14, 24, 12, SKIN.cal],
      ]) {
        facade(x, top, W, 60, skin);
        roof(x - 1, top, W + 2, 3, 4);
      }

      // ---- Tram street row
      const near = [
        { x: -40, w: 22, h: 36, skin: SKIN.azul, chimney: 5 },
        { x: -18, w: 20, h: 38, skin: SKIN.vinho, chimney: 12 },
        { x: 2, w: 20, h: 36, skin: SKIN.azul, chimney: 4 },
        { x: 22, w: 18, h: 36, skin: SKIN.rosa, chimney: 11 },
        { x: 40, w: 20, h: 34, skin: SKIN.verde, chimney: 3 },
        { x: 68, w: 18, h: 36, skin: SKIN.ocre, chimney: 12 },
        { x: 86, w: 16, h: 34, skin: SKIN.mostarda, chimney: 3 },
        { x: 102, w: 18, h: 30, skin: SKIN.cal, floors: 1 },
      ];
      // A dark stair alley between the two middle houses, laundry goes across it
      w.rect(60, 60, 8, 60, M.DARK_W);
      for (let y = 66; y < 100; y += 2) w.rect(60, y, 8, 1, M.STONE_K);
      for (const h of near) {
        h.base = SL(h.x);
        house({ ...h, floors: h.floors || 2 });
        // Ground floor: doors, kept above the street line
        door(h.x + 3, h.base - 1, 4, 8);
        if (h.w > 16) door(h.x + h.w - 8, h.base - 1, 4, 8);
      }
      // Grandmother's balcony, her figure is drawn live
      w.nana = { x: 30, y: 52 };
      w.rect(28, 46, 7, 7, M.FRAME);
      w.rect(29, 46, 5, 6, M.ROOM);
      w.nanaRoom = w.addGroup(18.7, 26.5, 'room');
      w.lightRect(29, 46, 5, 6, N.WARM, w.nanaRoom);
      w.rect(26, 52, 11, 1, M.STONE_D);
      for (let i = 26; i < 37; i += 2) w.rect(i, 49, 1, 3, M.IRON);
      w.rect(26, 49, 11, 1, M.IRON);
      w.rect(25, 47, 2, 2, M.TER);
      w.px(25, 46, M.LEAF);
      w.px(26, 46, M.GERAN);
      w.px(26, 45, M.LEAF_L);
      w.rect(36, 47, 2, 2, M.TER);
      w.px(37, 46, M.GERAN);
      w.px(36, 46, M.LEAF);

      // The street itself, with its rails let into the stones
      for (let x = -40; x < 128; x++) {
        const y = SL(x);
        for (let j = 0; j < 11; j++) {
          const n = (x * 7 + j * 13 + (x >> 2) * 3) % 11;
          w.px(x, y + j, n < 2 ? M.COB_D : n === 7 ? M.COB_L : M.COB);
        }
        w.px(x, y, M.STONE_K);
        w.px(x, y + 1, M.STONE);
        w.px(x, y + 3, M.STEEL_R);
        w.px(x, y + 4, M.STEEL_S);
        w.px(x, y + 7, M.STEEL_R);
        w.px(x, y + 8, M.STEEL_S);
        w.px(x, y + 10, M.STONE);
        w.px(x, y + 11, M.STONE_K);
      }
      // Overhead wire: runs with the slope, held off the walls by span wires
      for (let x = -40; x < 122; x++) w.px(x, SL(x) - 21, M.WIRE);
      for (let x = -20; x < 118; x += 34) {
        const y = SL(x) - 21;
        w.rect(x, y - 4, 1, 4, M.WIRE);
      }

      // ---- Below the tram street: tiled retaining wall, a small shop, the Bica stair
      w.depth = 2;
      const lowTop = (x) => SL(x) + 12;
      for (let x = -40; x < 112; x++) {
        for (let y = lowTop(x); y < FG(x); y++) {
          const row = TILES.star[(y + 400) % 3];
          w.px(x, y, x < 0 ? (row[(x + 400) % 3] === '#' ? M.AZ_B : M.AZ_W) : x % 9 === 0 || (y + (x >> 3)) % 4 === 0 ? M.STONE_D : M.STONE);
        }
      }
      // The wall under the street is faced in tile, like every wall that holds up a hill here
      for (let x = 20; x < 99; x++) {
        for (let y = lowTop(x); y < 110; y++) {
          const row = TILES.cross[(y + 400) % 4];
          w.px(x, y, row[(x + 400) % 4] === '#' ? M.AZ_B : M.AZ_W);
        }
        w.px(x, lowTop(x), M.STONE_K);
      }
      // A shop under a tile porch
      const sx0 = 60;
      w.rect(sx0, 112, 38, FG(sx0 + 38) - 112 + 2, M.LIME);
      w.hsign(sx0 + 1, 112, 37, 8, 'CONSERVAS', { n: N.B_WHITE, g: sign(), board: M.AZ_B, mode: 'tube', off: M.AZ_W });
      w.rect(sx0 + 2, 120, 23, 5, M.GLASS_DK);
      w.lightRect(sx0 + 2, 120, 23, 5, N.WARM, shop);
      const tins = [M.BUNT_R, M.BUNT_Y, M.BUNT_B, M.BUNT_G, M.AZ_W];
      for (let i = 0; i < 11; i++) w.rect(sx0 + 3 + i * 2, 122, 1, 2, tins[i % 5]);
      for (let i = 0; i < 7; i++) w.px(sx0 + 4 + i * 3, 120, tins[(i + 2) % 5]);
      door(sx0 + 30, FG(sx0 + 30), 5, 8);
      roof(sx0 - 1, 112, 40, 3);
      w.cat.x = 72;
      w.cat.y = 108;

      // Bougainvillea over the wall
      for (let i = 0; i < 46; i++) {
        const x = 98 + Math.floor(r() * 14);
        const y = lowTop(x) + Math.floor(r() * r() * 9);
        w.px(x, y, r() < 0.7 ? M.BOUG : M.LEAF_D);
      }

      // Bica: steps on one side, rails up the middle
      for (let x = -12; x < 60; x++) {
        const top = Math.max(BY(x), lowTop(x));
        for (let y = top; y < Math.min(BY(x) + 19, FG(x) + 1); y++) {
          const j = y - BY(x);
          let mt = M.COB;
          if (j === 9 || j === 13) mt = M.STEEL_R;
          else if (j >= 15) mt = x % 2 ? M.STEP : M.STONE_K;
          else if ((x + y) % 5 === 0) mt = M.COB_D;
          w.px(x, y, mt);
        }
        if (BY(x) >= lowTop(x)) w.px(x, BY(x), M.STONE_K);
      }
      // What's left below the stair is a low house front
      tiled(-40, 112, 58, 18, TILES.star, M.AZ_B, M.AZ_W);
      for (let x = -40; x < 18; x++) w.px(x, 111, M.STONE);
      w.rect(18, 112, 1, 14, M.STONE_D);
      door(8, FG(8), 5, 8);
      windowAt(0, 115, 3, 4, {});

      // ---- Right hill, back row
      w.depth = 2;
      for (const [x, W, top, skin] of [
        [278, 30, 12, SKIN.salvia],
        [308, 26, 2, SKIN.ceu],
        [334, 30, -8, SKIN.ocre],
      ]) {
        facade(x, top, W, 60, skin);
        roof(x - 1, top, W + 2, 3, 6);
        for (let wy = top + 3; wy < top + 16; wy += 7) for (let wx = x + 3; wx < x + W - 4; wx += 7) windowAt(wx, wy, 3, 4);
      }

      // Upper row: signs step up the slope with the street
      const u1 = 205;
      const u2 = 240;
      const u3 = 280;
      const u4 = 312;
      const B1 = SR(u2);
      const B2 = SR(u3);
      const B3 = SR(u4);
      const top1 = B1 - 38;
      const top2 = B2 - 36;
      const top3 = B3 - 32;
      facade(u1, top1, u2 - u1, 60, SKIN.ocre);
      w.rect(u1, top1, u2 - u1, 1, M.FRAME);
      roof(u1 - 1, top1, u2 - u1 + 2, 4, 6);
      facade(u2, top2, u3 - u2, 60, SKIN.azul);
      w.rect(u2, top2, u3 - u2, 1, M.FRAME);
      roof(u2 - 1, top2, u3 - u2 + 2, 4, 30);
      facade(u3, top3, u4 - u3, 60, SKIN.vinho);
      w.rect(u3, top3, u4 - u3, 1, M.FRAME);
      roof(u3 - 1, top3, u4 - u3 + 2, 4, 5);
      facade(u4, SR(350) - 32, 60, 80, SKIN.verde);
      roof(u4 - 1, SR(350) - 32, 62, 4, 10);

      windowAt(209, top1 + 3, 3, 6, { balcony: true, flowers: true });
      windowAt(216, top1 + 3, 3, 6, { balcony: true });
      windowAt(209, top1 + 13, 3, 4, {});

      // Sardine on the wall, its tail is drawn live
      w.sard = { x: 241, y: top2 + 2, g: sign(), eye: sign() };
      const sx = w.sard.x;
      const sy = w.sard.y;
      const sh = (i) => Math.round(6.4 * Math.sin(Math.PI * Math.pow((i + 1) / 34, 0.72)));
      const midY = sy + 7;
      for (let i = 0; i < 33; i++) {
        const h = sh(i);
        for (let j = -h + 1; j < h; j++) w.px(sx + i, midY + j, j > 0 ? M.SARD_S : M.SARD_D);
      }
      for (let i = 0; i < 33; i++) {
        const h = sh(i);
        w.tube(sx + i, midY - h, M.TUBE_K, N.CYAN, w.sard.g);
        w.tube(sx + i, midY + h, M.TUBE_K, N.CYAN, w.sard.g);
      }
      for (let j = -3; j <= 3; j++) w.tube(sx + 8 - Math.round(Math.abs(j) * 0.5), midY + j, M.TUBE_K, N.CYAN, w.sard.g);
      w.tube(sx - 1, midY, M.TUBE_K, N.CYAN, w.sard.g);
      w.tube(sx + 3, midY - 2, M.FRAME, N.YELLOW, w.sard.eye);
      w.tube(sx + 3, midY - 3, M.FRAME, N.YELLOW, w.sard.eye);
      w.tube(sx + 4, midY - 2, M.FRAME, N.YELLOW, w.sard.eye);
      w.tube(sx + 4, midY - 3, M.FRAME, N.YELLOW, w.sard.eye);
      for (let i = 11; i < 30; i += 3) {
        const z = (i - 11) % 6 === 0 ? 0 : 1;
        w.tube(sx + i, midY - 2 + z, M.TUBE_K, N.PINK, w.sard.g);
        w.tube(sx + i + 1, midY - 1 + z, M.TUBE_K, N.PINK, w.sard.g);
        w.tube(sx + i, midY + 1 + z, M.TUBE_K, N.PINK, w.sard.g);
      }
      for (let i = 0; i < 5; i++) w.tube(sx + 15 + i, midY - sh(15) - 1 - (i < 3 ? 1 : 0), M.TUBE_K, N.CYAN, w.sard.g);
      for (let i = 0; i < 3; i++) w.tube(sx + 19 + i, midY + sh(19) + 1, M.TUBE_K, N.CYAN, w.sard.g);

      // Shop boards. Accents are added by hand so the baseline never shifts.
      const accent = (x, y, W, h, text, idx, font, rows, n, g, mode) => {
        const f = font === 5 ? FONT5 : FONT3;
        const widths = [...text].map((c) => f[c][0].length);
        const total = widths.reduce((a, b) => a + b + 1, -1);
        const cx0 = x + Math.floor((W - total) / 2) + widths.slice(0, idx).reduce((a, b) => a + b + 1, 0);
        const lh = font === 5 ? 7 : 5;
        const ly = y + Math.floor((h - lh) / 2);
        rows.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            if (row[i] !== '#') continue;
            const px = cx0 + i;
            const py = ly - rows.length - 1 + j;
            if (mode === 'lit') w.px(px, py, M.PAINT_K);
            else w.tube(px, py, M.TUBE, n, g);
          }
        });
      };

      // FARMÁCIA with its cross
      const fg = sign();
      w.hsign(u1, B1 - 19, 35, 10, 'FARMACIA', { n: N.GREEN, g: fg, board: M.BOARD_K });
      accent(u1, B1 - 19, 35, 10, 'FARMACIA', 4, 3, ['.##'], N.GREEN, fg);
      w.cross = { x: u2 - 10, y: B1 - 31, g: w.addGroup(18.7, 40) };
      w.rect(u2 - 11, B1 - 32, 11, 11, M.BOARD_K);
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) if ((i > 2 && i < 6) || (j > 2 && j < 6)) w.tube(w.cross.x + i, w.cross.y + j, M.BOARD_G, N.B_GREEN, w.cross.g);
      }
      // Door and window on the street
      door(u1 + 4, B1 - 1, 5, 8);
      w.rect(u1 + 12, B1 - 8, 16, 7, M.GLASS_DK);
      w.lightRect(u1 + 12, B1 - 8, 16, 7, N.FLUO, shop);
      w.rect(u1 + 19, B1 - 8, 1, 7, M.STONE);
      door(u2 - 5, B1 - 1, 3, 8);

      // PASTELARIA, trays in the window
      const pg = sign();
      w.hsign(u2 + 1, B2 - 19, 41, 10, 'PASTELARIA', { n: N.B_WHITE, g: pg, board: M.BOARD_W, mode: 'lit' });
      w.rect(u2 + 2, B2 - 9, 26, 8, M.GLASS_DK);
      w.lightRect(u2 + 2, B2 - 9, 26, 8, N.WARM, shop);
      w.rect(u2 + 2, B2 - 5, 26, 1, M.STONE);
      for (let i = 0; i < 12; i++) w.px(u2 + 3 + i * 2, B2 - 6, i % 2 ? M.OCRE : M.TER);
      door(u2 + 33, B2 - 1, 5, 8);

      w.hsign(u2 + 2, B2 + 1, 19, 8, 'BICA', { n: N.YELLOW, g: sign(), board: M.BOARD_K });

      // TASCA, red
      w.hsign(u3 + 1, B3 - 21, 30, 11, 'TASCA', { n: N.RED, g: sign(), board: M.BOARD_K, font: 5 });
      w.rect(u3 + 3, B3 - 9, 12, 8, M.GLASS_DK);
      w.lightRect(u3 + 3, B3 - 9, 12, 8, N.WARM, w.myWin[3]);
      door(u3 + 20, B3 - 1, 5, 8);
      windowAt(u3 + 4, top3 + 3, 3, 5, { balcony: true, lit: true });
      windowAt(u3 + 14, top3 + 3, 3, 5, { balcony: true, flowers: true });
      windowAt(u3 + 24, top3 + 3, 3, 5, { balcony: true, lit: false });

      // The neon street
      for (let x = 196; x < 360; x++) {
        const y = SR(x);
        for (let j = 0; j < 9; j++) {
          const n = (x * 7 + j * 13 + (x >> 2) * 3) % 11;
          w.px(x, y + j, n < 2 ? M.COB_D : n === 7 ? M.COB_L : M.COB);
        }
        w.px(x, y, M.STONE_K);
        w.px(x, y + 9, M.STONE);
        w.px(x, y + 10, M.STONE_K);
      }

      // ---- Lower row, standing on the foreground
      const lowR = (x) => SR(x) + 11;
      for (let x = 196; x < 360; x++) {
        for (let y = lowR(x); y < FG(x); y++) {
          w.px(x, y, (x % 7 === 0 || (y + (x >> 3)) % 4 === 0) && y % 2 ? M.STONE_D : M.STONE);
        }
      }

      // GINJINHA: a door and a counter, nothing more, as it should be
      const gx = 199;
      const gy = 112;
      facade(gx, gy, 36, FG(gx) - gy + 1, SKIN.cruz);
      const gs = sign();
      w.hsign(gx, gy, 36, 9, 'GINJINHA', { n: N.B_RED, g: gs, board: M.BOARD_R, mode: 'lit' });
      w.rect(gx + 11, gy + 9, 12, FG(gx) - gy - 8, M.FRAME);
      w.rect(gx + 12, gy + 10, 10, FG(gx) - gy - 9, M.ROOM);
      w.lightRect(gx + 12, gy + 10, 10, FG(gx) - gy - 9, N.FADO_ROOM, w.addGroup(17.8, 29, 'room'));
      w.rect(gx + 12, gy + 13, 10, 1, M.WOOD_DK);
      for (let i = 0; i < 5; i++) w.px(gx + 13 + i * 2, gy + 12, M.BUNT_R);
      w.px(gx + 13, gy + 11, M.GLASS_DK);
      w.px(gx + 16, gy + 11, M.GLASS_DK);
      w.px(gx + 19, gy + 11, M.GLASS_DK);

      // FADO house: the guitar over the name over the window
      const fx = 235;
      const ftop = lowR(266);
      const fb = FG(fx);
      for (let x = fx; x < 268; x++) for (let y = Math.max(ftop, lowR(x)); y < fb + 1; y++) w.px(x, y, M.ROSE);
      for (let x = fx; x < 268; x++) w.px(x, fb - 4, M.STONE);
      tiled(fx, fb - 3, 33, 4, TILES.pombal, M.AZ_B, M.AZ_W);
      const fadoRoom = w.addGroup(18.7, 29, 'room');
      w.rect(fx, 88, 33, 12, M.BOARD_K);
      const guitarBody = sign();
      const guitarStrings = sign();
      GUITAR.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) if (row[i] === '#') w.tube(fx + i, 89 + j, M.TUBE, i > 26 ? N.YELLOW : N.ORANGE, guitarBody);
      });
      for (let i = 2; i < 27; i++) if (i < 4 || i > 8) w.tube(fx + i, 94, M.TUBE, N.WHITE, guitarStrings);
      w.hsign(fx + 5, 100, 23, 11, 'FADO', { n: N.ORANGE, g: sign(), board: M.BOARD_K, font: 5 });
      w.fado = { x: fx + 3, y: 111, w: 18, h: fb - 111 - 4, g: fadoRoom };
      w.rect(fx + 2, 110, 20, fb - 110 - 3, M.WOOD_DK);
      w.rect(fx + 3, 111, 18, fb - 111 - 4, M.GLASS_DK);
      w.lightRect(fx + 3, 111, 18, fb - 111 - 4, N.FADO_ROOM, fadoRoom);
      w.rect(fx + 25, 112, 6, fb - 112, M.WOOD_DK);
      w.rect(fx + 26, 113, 4, fb - 113, M.WOOD);
      w.rect(fx + 28, 113, 1, fb - 113, M.WOOD_DK);

      // CERVEJARIA and PENSÃO share the tall corner
      const cerx = 268;
      const cert = lowR(312);
      for (let x = cerx; x < 312; x++) for (let y = Math.max(cert, lowR(x)); y < FG(x) + 1; y++) w.px(x, y, M.LIME);
      for (let x = cerx; x < 312; x++) for (let y = lowR(x); y < cert; y++) w.px(x, y, M.STONE);
      tiled(cerx, FG(cerx) - 3, 44, 4, TILES.lattice, M.AZ_G, M.AZ_W);
      const peng = sign();
      w.hsign(cerx + 4, 85, 37, 13, 'PENSAO', { n: N.WHITE, g: peng, board: M.AZ_B, font: 5, off: M.AZ_W });
      accent(cerx + 4, 85, 37, 13, 'PENSAO', 4, 5, ['.##.#', '#.##.'], N.WHITE, peng);
      windowAt(cerx + 26, 76, 3, 5, { balcony: true, lit: true });
      windowAt(cerx + 36, 72, 3, 5, { balcony: true, flowers: true, lit: true });
      w.hsign(cerx + 1, 100, 42, 9, 'CERVEJARIA', { n: N.B_YELLOW, g: sign(), board: M.BOARD_Y, mode: 'lit' });
      w.rect(cerx + 3, 109, 26, FG(cerx) - 113, M.GLASS_DK);
      w.lightRect(cerx + 3, 109, 26, FG(cerx) - 113, N.WARM, shop);
      for (let i = 0; i < 4; i++) w.rect(cerx + 6 + i * 6, 110, 1, 3, M.TER);
      door(cerx + 34, FG(cerx + 34), 6, 10);

      // HOTEL on its bracket, out over the view
      w.rect(195, 63, 10, 1, M.IRON);
      w.vsign(195, 64, 'HOTEL', { n: N.PINK, g: sign(), board: M.BOARD_K, w: 9, font: 5 });

      // ---- The gap: parapet of the miradouro
      for (let x = 112; x < 205; x++) {
        for (let y = WATER_END; y < 128; y++) w.px(x, y, y === WATER_END ? M.STONE : M.STONE_D);
        for (let i = 0; i < 4; i++) {
          const y = WATER_END + 2 + i;
          const row = TILES.cross[y % 4];
          w.px(x, y, row[x % 4] === '#' ? M.AZ_B : M.AZ_W);
        }
        w.px(x, WATER_END - 4, M.IRON);
        if (x % 3 === 0) w.rect(x, WATER_END - 3, 1, 3, M.IRON);
      }

      // ---- Calçada: the waves of Rossio, black on white
      for (let x = -40; x < 360; x++) {
        for (let y = FG(x); y < 151; y++) {
          const yy = y + 2.6 * Math.sin(x * 0.22) + 1.2 * Math.sin(x * 0.07 + 1);
          const v = Math.pow(Math.max(0, yy - 118), 1.18) / 3.3;
          const black = v % 2 > 1.25;
          const n = (x * 7 + y * 13 + (x * y) % 5) % 9;
          w.px(x, y, black ? (n === 0 ? M.CALC_K2 : M.CALC_K) : n === 0 ? M.CALC_W2 : M.CALC_W);
        }
      }

      // ---- Santa Justa, standing alone, with its walkway back to the hill
      w.depth = 2;
      const LACE = ['###########', '#....#....#', '#...#.#...#', '#..#...#..#', '#.#.....#.#', '#.#.....#.#', '#.#..#..#.#', '#.#..#..#.#', '#.#..#..#.#', '#.#..#..#.#'];
      const lx = 100;
      const ltop = 52;
      const lfoot = FG(lx + 5);
      const liftG = w.addGroup(18.9, 28.8, 'neon', { soft: true });
      for (let y = ltop; y < lfoot; y++) {
        const row = LACE[(y - ltop) % LACE.length];
        for (let i = 0; i < 11; i++) if (row[i] === '#') w.px(lx + i, y, i === 0 || i === 10 ? M.IRON : M.IRON_L);
      }
      for (let y = ltop + 5; y < lfoot; y += 10) {
        w.tube(lx + 1, y, M.IRON_L, N.LED, liftG);
        w.tube(lx + 9, y, M.IRON_L, N.LED, liftG);
      }
      // Gallery and crown
      w.rect(lx - 2, ltop - 1, 15, 2, M.IRON);
      for (let i = -2; i < 13; i += 2) w.rect(lx + i, ltop - 5, 1, 4, M.IRON_L);
      w.rect(lx - 2, ltop - 6, 15, 1, M.IRON);
      w.rect(lx + 3, ltop - 10, 5, 4, M.IRON_L);
      w.rect(lx + 4, ltop - 12, 3, 2, M.IRON);
      w.px(lx + 5, ltop - 13, M.IRON);
      w.px(lx + 5, ltop - 14, M.IRON);
      for (const px of [-2, 12]) w.rect(lx + px, ltop - 9, 1, 3, M.IRON);
      for (const px of [2, 8]) w.rect(lx + px, ltop - 8, 1, 2, M.IRON);
      for (let i = 0; i < 15; i += 3) w.tube(lx - 2 + i, ltop - 1, M.IRON, N.LED, liftG);
      // Walkway
      for (let x = 84; x < lx; x++) {
        w.px(x, 56, M.IRON);
        w.px(x, 60, M.IRON);
        if (x % 4 === 0) w.rect(x, 57, 1, 3, M.IRON);
        if (x % 4 === 2) w.px(x, 58, M.IRON_L);
        if (x % 8 === 0) w.tube(x, 60, M.IRON, N.LED, liftG);
      }
      w.rect(lx + 2, lfoot - 3, 7, 3, M.STONE_D);
      w.lift = { x: lx + 4, y: 90, dir: -1, wait: 0, top: ltop + 3, bottom: lfoot - 12, g: liftG };

      // ---- A tree at the foot of the street: the tram goes behind it
      w.depth = 3;
      for (let y = 104; y < 129; y++) w.rect(118 + (y < 116 ? 1 : 0), y, 3, 1, y % 3 ? M.BARK : M.BARK_LT);
      const blob = (cx0, cy0, rad) => {
        for (let j = -rad; j <= rad; j++) {
          for (let i = -rad - 2; i <= rad + 2; i++) {
            if (i * i * 0.7 + j * j > rad * rad + r() * 6) continue;
            const n = r();
            w.px(cx0 + i, cy0 + j, j < -rad * 0.3 && n < 0.4 ? M.LEAF_L : j > rad * 0.3 && n < 0.6 ? M.LEAF_D : n < 0.2 ? M.LEAF_D : M.LEAF);
          }
        }
      };
      blob(119, 98, 8);
      blob(113, 103, 6);
      blob(125, 104, 6);

      // ---- Lamps: iron brackets, amber pools
      w.depth = 2;
      const lamps = [];
      const lampAt = (x, y, rad, opts = {}) => {
        const g = w.addGroup(18.7 + lamps.length * 0.05, 28.9, 'neon', { soft: true });
        lamps.push({ x, y, rad, g: w.addGroup(19.75 + lamps.length * 0.02, 28.7, 'neon', { soft: true }) });
        if (!opts.bare) {
          w.rect(x - 1, y - 1, 3, 1, M.IRON);
          w.rect(x - 1, y + 2, 3, 1, M.IRON);
          w.px(x - 1, y, M.IRON);
          w.px(x + 1, y, M.IRON);
          w.px(x - 1, y + 1, M.IRON);
          w.px(x + 1, y + 1, M.IRON);
          w.tube(x, y, M.LAMP_OFF, N.LAMP, g);
          w.tube(x, y + 1, M.LAMP_OFF, N.LAMP, g);
          w.px(x, y - 2, M.IRON);
          w.rect(x, y - 3, 3, 1, M.IRON);
        }
      };
      const post = (x, y, foot, rad) => {
        w.rect(x, y + 3, 1, foot - y - 3, M.IRON);
        w.rect(x - 1, foot - 2, 3, 2, M.IRON);
        lampAt(x, y, rad);
      };
      lampAt(14, SL(14) - 27, 26);
      lampAt(50, SL(50) - 27, 26);
      lampAt(92, SL(92) - 27, 26);
      post(57, 104, FG(57), 26);
      lampAt(90, 127, 18, { bare: true });
      post(128, 104, 128, 26);
      post(189, 104, 128, 24);
      lampAt(238, B1 - 6, 20, { bare: true });
      lampAt(270, B2 - 5, 20, { bare: true });
      lampAt(302, B3 - 5, 20, { bare: true });
      lampAt(237, 104, 22);
      lampAt(265, 106, 28);
      post(226, 125, FG(226) + 6, 24);
      post(292, 120, FG(292) + 4, 22);
      for (const [x, y, rad] of [[70, 137, 20], [128, 137, 22], [170, 138, 18], [226, 137, 22], [268, 136, 20]]) lampAt(x, y, rad, { bare: true });

      // Warm wash, baked once. Lit tile stays tile: pale pixels catch more than dark ones.
      const tiers = new Uint8Array(BW * BH);
      const amb = [0, N.AMB1, N.AMB2, N.AMB3, N.AMB4, N.AMB5, N.AMB6];
      for (const L of lamps) {
        for (let j = -L.rad; j <= L.rad; j++) {
          for (let i = -L.rad; i <= L.rad; i++) {
            const bx = L.x + i + PAD_X;
            const by = L.y + j + PAD_Y;
            if (bx < 0 || by < 0 || bx >= BW || by >= BH) continue;
            const k = by * BW + bx;
            const lum = LUM[w.smat[k]];
            if (!lum || (w.sneon[k] && tiers[k] === 0)) continue;
            const d = Math.hypot(i, j * 1.1) / L.rad;
            if (d >= 1) continue;
            const v = lum * (1 - d) * (1 - d * 0.4) * 7 + BAYER[((by & 3) << 2) | (bx & 3)] / 16 - 0.5;
            const t = clamp(Math.floor(v), 0, 6);
            if (t <= tiers[k]) continue;
            tiers[k] = t;
            w.sneon[k] = amb[t];
            w.sgroup[k] = L.g;
          }
        }
      }

      // ---- Actors
      w.depth = 0;
      w.personStyles = {
        tourist: [M.TOUR_A, M.SHORTS, M.HAIR],
        cyan: [M.TOUR_B, M.SHORTS, M.COAT],
        yellow: [M.TOUR_C, M.JEAN, M.HAIR],
        widow: [M.BLACK, M.BLACK, M.GREY_H],
        shirt: [M.SHIRT, M.JEAN, M.HAIR],
        suit: [M.SUIT, M.SUIT, M.HAIR],
      };
      for (const p of [
        { x: 66, dir: 1, speed: 6, style: 'tourist', road: 'F', off: 4 },
        { x: 200, dir: -1, speed: 7, style: 'shirt', road: 'F', off: 7 },
        { x: 150, dir: 1, speed: 5, style: 'widow', road: 'F', off: 2 },
        { x: 245, dir: 1, speed: 6, style: 'yellow', road: 'F', off: 5, nightOnly: true },
        { x: 270, dir: -1, speed: 5.5, style: 'suit', road: 'F', off: 6, nightOnly: true },
        { x: 32, dir: 1, speed: 5, style: 'cyan', road: 'L', off: 2 },
        { x: 80, dir: -1, speed: 4, style: 'widow', road: 'L', off: 2 },
        { x: 262, dir: 1, speed: 4.5, style: 'tourist', road: 'R', off: 6 },
        { x: 220, dir: -1, speed: 5, style: 'shirt', road: 'R', off: 6 },
        { x: 300, dir: -1, speed: 4, style: 'suit', road: 'R', off: 6, nightOnly: true },
      ])
        w.peds.push({ phase: r() * 2, y: 0, ...p });
      w.pedsBack = w.peds.filter((p) => p.road === 'L');
      w.pedsFront = w.peds.filter((p) => p.road !== 'L');

      w.tram = { x: 62, dir: -1, v: 0, wait: 0, sway: 0, stopped: false };
      w.bica = { x: 26, dir: 1, wait: 0 };
      w.ferry = { x: 124, dir: 1 };
      w.bridgeCars = Array.from({ length: 12 }, (_, i) => ({ x: 126 + r() * 80, dir: i % 2 ? 1 : -1, v: 2 + r() * 1.5 }));
      w.tuks = [
        { x: 40, dir: 1, v: 15, body: M.TUK_G },
        { x: 240, dir: -1, v: 13, body: M.TUK_R },
      ];
      w.clouds = [
        { x: 104, y: 16, v: 0.9, lobes: [[0, 2], [5, 4], [11, 5], [17, 3], [22, 2]] },
        { x: 214, y: 12, v: 0.7, lobes: [[0, 2], [4, 3], [9, 3], [13, 1]] },
        { x: 20, y: 22, v: 0.8, lobes: [[0, 3], [6, 4], [12, 2]] },
      ];
      w.gulls = Array.from({ length: 11 }, (_, i) => ({
        x: 100 + r() * 130,
        y: 16 + r() * 44,
        p: r() * 6,
        v: (r() < 0.5 ? -1 : 1) * (3 + r() * 3),
        scare: 0,
        perch: i > 7 ? [[61, 26], [170, WATER_END - 5], [146, WATER_END - 5]][i - 8] : null,
      }));
      w.smoke = Array.from({ length: 20 }, (_, i) => ({ x: 0, y: -99, a: i / 20 }));
      w.grills = [
        { x: 242, y: 135 },
        { x: 78, y: 133 },
      ];
      w.laundry = [
        { x0: 59, y0: 62, x1: 69, y1: 66, items: [[1, 2, 5, M.SHEET], [4, 2, 4, M.BUNT_B], [7, 1, 3, M.BUNT_R]] },
        { x0: 59, y0: 74, x1: 69, y1: 78, items: [[2, 3, 6, M.SHEET], [6, 2, 4, M.BUNT_Y]] },
        { x0: 4, y0: 40, x1: 21, y1: 44, items: [[2, 4, 7, M.SHEET], [7, 3, 4, M.TOUR_B], [11, 4, 6, M.BUNT_P], [15, 1, 3, M.SHEET_S]] },
        { x0: 282, y0: 58, x1: 302, y1: 58, items: [[2, 3, 5, M.SHEET], [7, 2, 4, M.BUNT_R], [12, 3, 4, M.TOUR_C]] },
      ];
      w.bunting = [
        { x0: 206, y0: 90, x1: 233, y1: 88, sag: 3 },
        { x0: 270, y0: 110, x1: 310, y1: 109, sag: 1 },
        { x0: 136, y0: 114, x1: 193, y1: 114, sag: 2 },
      ];
      w.rocket = { state: 0, next: 3, x: 0, y: 0, c: 0, t: 0 };
      w.rocketCols = [N.RED, N.YELLOW, N.GREEN, N.WHITE, N.ORANGE, N.PINK];
    },

    draw(w, dt, hour, hurry) {
      const wind = 1 + hurry * 4;
      const night = w.dark > 0.45;

      drawSky(w, dt, hour);
      drawBridgeLife(w, dt, hour);
      for (const p of w.peds) {
        if (p.road === 'L') {
          if (p.x < -30) p.dir = 1;
          if (p.x > 96) p.dir = -1;
          p.y = SL(p.x);
        } else if (p.road === 'R') {
          if (p.x < 208) p.dir = 1;
          if (p.x > 330) p.dir = -1;
          p.y = SR(p.x) + p.off;
        } else p.y = FG(p.x) + p.off;
      }
      w.peds = w.pedsBack;
      w.drawPeople(dt, hour);
      drawTram(w, dt, hurry);
      drawBica(w, dt);
      drawLift(w, dt);
      drawNana(w, hour);
      drawFado(w);
      drawSardine(w);
      drawLaundry(w, wind);
      drawCrowd(w, hour);
      drawGinjinha(w, hour);

      w.peds = w.pedsFront;
      w.drawPeople(dt, hour);
      w.drawCat(dt, hour);
      drawBunting(w, wind);
      drawGrills(w, dt, hurry);
      drawTuks(w, dt, night);
      drawGulls(w, dt, hurry, night);
    },

    post(w, dt, hour) {
      w.mirrorWater(HORIZON, WATER_END, [M.RIVER, M.RIVER_D, M.RIVER_L], { strength: 0.55, squash: 1.15, ripple: 0.5 });
      drawGlitter(w, hour);
      w.drawBeams();
    },

    startle(w) {
      w.cat.puff = 1.4;
      for (const g of w.gulls) g.scare = (g.perch ? 5.5 : 2.4) + w.rand();
      w.tram.sway = 1;
    },
  };

  const sunAt = (hour) => {
    if (hour < 19.6) {
      const t = (hour - 12) / 7.5;
      return { x: mix(182, SUN_X, smooth(0, 0.7, t)), y: mix(13, 94, Math.pow(t, 2.3)), R: Math.round(mix(6, 14, smooth(16.2, 18.8, hour))) };
    }
    if (hour > 30.5) {
      const t = (hour - 30.5) / 5.5;
      return { x: mix(70, 182, t), y: mix(66, 13, smooth(0, 0.8, t)), R: 6 };
    }
    return null;
  };
  const moonAt = (hour) => (hour > 19.4 && hour < 30 ? { x: mix(196, 132, (hour - 19.4) / 10.6), y: 22 + Math.abs(hour - 24.7) * 0.8 } : null);

  function drawSky(w, dt, hour) {
    const sun = sunAt(hour);
    if (sun) {
      const { R } = sun;
      const sx = Math.round(sun.x);
      const sy = Math.round(sun.y);
      const low = smooth(16.5, 18.6, hour);
      for (let j = -R; j <= R; j++) {
        for (let i = -R; i <= R; i++) {
          const d2 = i * i + j * j;
          if (d2 > R * R + 2) continue;
          const bx = sx + i + PAD_X;
          const by = sy + j + PAD_Y;
          if (bx < 0 || by < 0 || bx >= BW || by >= BH) continue;
          const k = by * BW + bx;
          if (w.smat[k] !== 0) continue;
          // Low sun: bands of the atmosphere across a huge orange disc
          let n = N.SUN;
          if (low > 0.15) {
            const f = (j + R) / (2 * R);
            const band = low > 0.6 && j > 2 && (j + Math.floor(i / 7)) % 4 === 0;
            n = f < 0.28 ? N.SUN_A : f < 0.6 ? N.SUN_B : f < 0.82 ? N.SUN_C : N.SUN_D;
            if (band) n = N.SUN_D;
          }
          w.fneon[k] = n;
          w.fgroup[k] = 1;
        }
      }
    }
    const moon = moonAt(hour);
    if (moon && w.dark > 0.3) w.moon(moon.x, moon.y);
    w.drawStars();
    for (const c of w.clouds) {
      c.x += c.v * dt;
      if (c.x > 360) c.x = -50;
      const x0 = Math.round(c.x);
      for (const [dx, R] of c.lobes) {
        for (let i = -R - 1; i <= R + 1; i++) {
          const h = Math.round(Math.sqrt(Math.max(0, R * R + 2 - i * i)));
          for (let j = -h; j <= 0; j++) w.pxSky(x0 + dx + i, c.y + j, j === 0 ? M.CLOUD_SH : M.CLOUD);
        }
      }
    }
    w.drawBeacons();

    // The castle's flag: green at the hoist, red beyond
    const [fx, fy] = w.flagAt;
    for (let j = 0; j < 5; j++) w.px(fx, fy + j, M.IRON);
    for (let i = 1; i < 6; i++) {
      const dy = Math.round(Math.sin(w.t * 5 + i * 0.9) * 0.7);
      for (let j = 0; j < 3; j++) w.pxBehind(fx + i, fy + j + dy, i < 3 ? M.FLAG_G : M.FLAG_R);
    }

    // Fireworks over the river, once in a long while
    const fw = w.rocket;
    if (hour > 20.3 && hour < 27.5) {
      fw.next -= dt;
      if (fw.state === 0 && fw.next <= 0) {
        fw.state = 1;
        fw.x = 130 + Math.floor(w.rand() * 60);
        fw.y = HORIZON;
        fw.top = 26 + Math.floor(w.rand() * 18);
        fw.c = w.rocketCols[Math.floor(w.rand() * w.rocketCols.length)];
      }
    }
    if (fw.state === 1) {
      fw.y -= dt * 42;
      const k = (Math.round(fw.y) + PAD_Y) * BW + fw.x + PAD_X;
      if (w.smat[k] === 0) w.pxLight(fw.x, Math.round(fw.y), N.BULB);
      if (fw.y <= fw.top) {
        fw.state = 2;
        fw.t = 0;
      }
    } else if (fw.state === 2) {
      fw.t += dt;
      const f = fw.t / 1.5;
      const rad = 2 + 11 * Math.sqrt(Math.min(1, f));
      for (let a = 0; a < 16; a++) {
        if (f > 0.55 && (a * 7 + Math.floor(fw.t * 18)) % 3 === 0) continue;
        const ang = (a / 16) * Math.PI * 2;
        const px = Math.round(fw.x + Math.cos(ang) * rad);
        const py = Math.round(fw.top + Math.sin(ang) * rad + f * f * 5);
        const k = (py + PAD_Y) * BW + px + PAD_X;
        if (k >= 0 && k < w.smat.length && w.smat[k] === 0) w.pxLight(px, py, fw.c);
      }
      if (f >= 1) {
        fw.state = 0;
        fw.next = 7 + w.rand() * 11;
      }
    }
  }

  function drawBridgeLife(w, dt, hour) {
    for (const c of w.bridgeCars) {
      c.x += c.dir * c.v * dt;
      if (c.x > 204) c.x = 128;
      if (c.x < 128) c.x = 204;
      const x = Math.round(c.x);
      const y = DECK - 1;
      w.pxBehind(x, y, c.dir > 0 ? M.GULL : M.CAR_R, w.dark > 0.3 ? (c.dir > 0 ? N.HEAD : N.TAIL) : 0, w.dark > 0.3 ? 1 : 0);
    }
    // Cacilheiro: orange and white, Cacilhas and back
    const f = w.ferry;
    f.x += f.dir * 2.6 * dt;
    if (f.x > 180) f.dir = -1;
    if (f.x < 126) f.dir = 1;
    const x = Math.round(f.x);
    const y = 106;
    const on = w.dark > 0.3;
    for (let i = 0; i < 18; i++) {
      const inset = i === 0 || i === 17 ? 1 : 0;
      w.pxBehind(x + i, y, M.FERRY_O);
      w.pxBehind(x + i, y + 1, M.FERRY_O);
      if (!inset) w.pxBehind(x + i, y + 2, M.CAST_D);
    }
    for (let i = 2; i < 16; i++) {
      for (let j = 1; j < 4; j++) w.pxBehind(x + i, y - j, j === 2 && i % 2 ? M.GLASS_DK : M.GULL, j === 2 && i % 2 && on ? N.WARM : 0, j === 2 && i % 2 && on ? 1 : 0);
    }
    for (let i = 5; i < 12; i++) w.pxBehind(x + i, y - 4, M.GULL);
    w.pxBehind(x + 9, y - 5, M.FERRY_O);
    w.pxBehind(x + 9, y - 6, M.BLACK);
    if (on) w.pxBehind(x + (f.dir > 0 ? 17 : 0), y - 1, M.GULL, N.HEAD, 1);
  }

  function drawTram(w, dt, hurry) {
    const T = w.tram;
    const LEN = 32;
    const stopX = 42;
    if (T.wait > 0) {
      T.wait -= dt;
      T.v = 0;
      if (T.wait <= 0) T.sway = 1;
    } else {
      const want = 9 + hurry * 8;
      T.v = mix(T.v, want, clamp(dt * 1.5));
      const prev = T.x;
      T.x += T.dir * T.v * dt;
      if ((prev - stopX) * (T.x - stopX) <= 0) {
        T.wait = 6;
        T.sway = 1;
      }
      if (T.x < -70) {
        T.dir = 1;
        T.wait = 2.5;
      }
      if (T.x > 150) {
        T.dir = -1;
        T.wait = 2.5;
      }
    }
    T.sway = Math.max(0, T.sway - dt * 0.8);
    const lean = Math.round(Math.sin(w.t * 9) * T.sway * 1.4);
    const trot = T.v > 1 ? Math.round(Math.sin(w.t * 13) * 0.4) : 0;
    const x0 = Math.round(T.x);
    const on = w.dark > 0.45;
    const col = (i) => (T.dir < 0 ? x0 + i : x0 + LEN - 1 - i);
    const put = (i, row, m, n = 0) => {
      const cx = col(i);
      const y = SL(cx) + 7 - row + (row > 2 ? trot : 0);
      w.pxBehind(cx + (row > 2 ? lean : 0), y, m, n, n ? 2 : 0);
    };
    for (let i = 0; i < LEN; i++) {
      // Underframe and skirt
      put(i, 1, M.TRAM_K);
      put(i, 2, M.TRAM_K);
      const end = i < 1 || i > LEN - 2;
      const vest = i < 5 || i > LEN - 6;
      // Yellow below, white above, the two colours of every 28 there has ever been
      for (let j = 3; j < 10; j++) put(i, j, end && j > 8 ? M.TRAM_K : j === 3 ? M.TRAM_Y2 : M.TRAM_Y);
      put(i, 9, M.TRAM_W);
      for (let j = 10; j < 15; j++) {
        const pillar = vest ? i === 4 || i === LEN - 5 || i === 0 || i === LEN - 1 : (i - 5) % 4 === 3;
        if (pillar) put(i, j, M.TRAM_W);
        else put(i, j, j === 14 ? M.GLASS_HI : M.GLASS, on ? N.TRAM_LIT : 0);
      }
      put(i, 15, M.TRAM_W);
      put(i, 16, M.TRAM_W);
      if (!end) put(i, 17, M.TRAM_R);
      if (i > 3 && i < LEN - 4) put(i, 18, M.TRAM_R);
    }
    // Trucks
    for (const c of [6, 7, 8, 9, LEN - 10, LEN - 9, LEN - 8, LEN - 7]) {
      put(c, 0, M.TIRE);
      put(c, 1, M.TIRE);
    }
    put(7, 1, M.STEEL_S);
    put(LEN - 9, 1, M.STEEL_S);
    // 28E on the flank
    const num = [
      ['###', '..#', '###', '#..', '###'],
      ['###', '#.#', '###', '#.#', '###'],
      ['###', '#..', '##.', '#..', '###'],
    ];
    num.forEach((rows, n) => {
      rows.forEach((row, j) => {
        for (let i = 0; i < 3; i++) if (row[i] === '#') put(T.dir < 0 ? 11 + n * 4 + i : LEN - 1 - (11 + n * 4 + i), 8 - j, M.TRAM_K);
      });
    });
    // People at the windows
    const heads = [6, 10, 14, 18, 22];
    heads.forEach((c, n) => {
      if ((n * 3 + 1) % 4 === 0) return;
      put(c, 11, M.BLACK);
      put(c, 12, on ? M.BLACK : M.SKIN);
      put(c, 13, on ? M.BLACK : M.HAIR);
    });
    // The one who always hangs off the back door
    const pendura = LEN;
    const hang = Math.round(Math.sin(w.t * 3.1) * (T.v > 1 ? 1 : 0.4));
    for (let j = 5; j < 10; j++) put(pendura, j, M.JEAN);
    put(pendura, 10, M.TOUR_A);
    put(pendura, 11, M.TOUR_A);
    put(pendura, 12, M.SKIN);
    put(pendura, 13, M.HAIR);
    put(pendura + 1 + (hang > 0 ? 1 : 0), 10, M.TOUR_A);
    // Lamps
    if (on) {
      put(0, 6, M.GULL, N.HEAD);
      put(LEN - 1, 6, M.CAR_R, N.TAIL);
    }
    // Trolley pole, trailing behind, to the wire
    const pi = T.dir < 0 ? 20 : LEN - 21;
    const baseX = x0 + pi + lean;
    const baseY = SL(x0 + pi) + 7 - 19;
    const tipX = baseX + 7;
    const tipY = SL(tipX) - 21;
    for (let s = 0; s <= 10; s++) {
      const px = Math.round(mix(baseX, tipX, s / 10));
      const py = Math.round(mix(baseY, tipY, s / 10));
      w.pxBehind(px, py, M.IRON);
    }
    if (on && T.v > 2 && Math.sin(w.t * 37) * Math.sin(w.t * 5.3) > 0.72) w.pxBehind(tipX, tipY, M.GULL, N.SPARK, 1);
  }

  function drawBica(w, dt) {
    const B = w.bica;
    if (B.wait > 0) B.wait -= dt;
    else {
      B.x += B.dir * 2.4 * dt;
      if (B.x > 36) {
        B.dir = -1;
        B.wait = 3;
      }
      if (B.x < 14) {
        B.dir = 1;
        B.wait = 3;
      }
    }
    const x0 = Math.round(B.x);
    const on = w.dark > 0.45;
    const LEN = 15;
    for (let i = 0; i < LEN; i++) {
      const base = BY(x0 + i) + 13;
      for (let j = 0; j < 12; j++) {
        let m = j < 1 ? M.TRAM_K : j < 5 ? M.TRAM_Y : j === 5 ? M.TRAM_W : j < 10 ? M.GLASS : j === 10 ? M.TRAM_W : M.TRAM_R;
        if (j >= 6 && j < 10 && (i === 0 || i === LEN - 1 || i % 5 === 2)) m = M.TRAM_W;
        if (j === 11 && (i === 0 || i === LEN - 1)) continue;
        w.px(x0 + i, base - j, m);
        if (m === M.GLASS && on) w.pxLight(x0 + i, base - j, N.TRAM_LIT, 2);
      }
    }
    // Cable, climbing out ahead of it
    for (let i = LEN; i < LEN + 8; i++) w.px(x0 + i, BY(x0 + i) + 11, M.WIRE);
  }

  function drawLift(w, dt) {
    const L = w.lift;
    if (L.wait > 0) L.wait -= dt;
    else {
      L.y += L.dir * 5 * dt;
      if (L.y < L.top) {
        L.dir = 1;
        L.wait = 4;
      }
      if (L.y > L.bottom) {
        L.dir = -1;
        L.wait = 4;
      }
    }
    const y = Math.round(L.y);
    w.rect(L.x, y, 3, 9, M.WOOD);
    w.rect(L.x, y, 3, 1, M.IRON);
    w.rect(L.x, y + 8, 3, 1, M.IRON);
    w.rect(L.x, y + 2, 3, 3, M.GLASS);
    if (w.dark > 0.45) for (let i = 0; i < 3; i++) for (let j = 2; j < 5; j++) w.pxLight(L.x + i, y + j, N.TRAM_LIT, 2);
  }

  function drawNana(w, hour) {
    const { x, y } = w.nana;
    const day = hour < 18.4 || hour > 31;
    if (day) {
      // Out on the balcony with a can, every plant gets its turn
      const phase = w.t % 11;
      const can = phase < 5;
      w.rect(x, y - 8, 3, 6, M.BLACK);
      w.rect(x, y - 11, 3, 3, M.SKIN);
      w.rect(x, y - 11, 3, 1, M.GREY_H);
      w.px(x - 1, y - 10, M.GREY_H);
      if (can) {
        w.px(x - 1, y - 7, M.SKIN);
        w.rect(x - 3, y - 7, 2, 2, M.STEEL_S);
        const drip = Math.floor(w.t * 8) % 4;
        w.px(x - 4, y - 5 + drip, M.AZ_B);
        w.px(x - 5, y - 6 + ((drip + 2) % 4), M.AZ_B);
      } else {
        w.px(x + 3, y - 6, M.SKIN);
        w.px(x + 3, y - 5, M.SKIN);
      }
    } else if (hour < 26.5) {
      // Still there, at the window, watching who comes home with whom
      w.rect(x, y - 3, 3, 3, M.BLACK);
      w.rect(x, y - 6, 3, 3, M.BLACK);
      w.px(x - 1, y - 3, M.BLACK);
      w.px(x + 3, y - 3, M.BLACK);
    }
  }

  function drawFado(w) {
    const F = w.fado;
    if (w.levels[F.g] < 0.5) return;
    const sway = Math.round(Math.sin(w.t * 0.9) * 1.2);
    const bottom = F.y + F.h - 1;
    // The singer, eyes closed, black shawl
    const sx = F.x + 4 + sway;
    for (let j = 0; j < 7; j++) w.rect(sx - (j > 3 ? 1 : 0), bottom - j, 4 + (j > 3 ? 1 : 0) * 1, 1, M.BLACK);
    w.rect(sx + 1, bottom - 9, 2, 2, M.BLACK);
    // Shawl swings out with the phrase
    if (Math.sin(w.t * 0.9) > 0.4) w.px(sx + 4, bottom - 5, M.BLACK);
    // The guitarist, seated, pear-shaped guitar on the knee
    const gx = F.x + 12;
    w.rect(gx, bottom - 5, 3, 6, M.BLACK);
    w.rect(gx, bottom - 7, 2, 2, M.BLACK);
    w.rect(gx - 3, bottom - 3, 3, 2, M.WOOD_DK);
    w.rect(gx - 5, bottom - 3, 2, 1, M.WOOD_DK);
    if (Math.floor(w.t * 4) % 2) w.px(gx + 3, bottom - 3, M.BLACK);
  }

  function drawSardine(w) {
    const S = w.sard;
    const beat = Math.floor(w.t * 2.2) % 2;
    const rows = TAIL[beat];
    const midY = S.y + 7;
    const lit = w.levels[S.g] > 0.5;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== '#') continue;
        const x = S.x + 32 + i;
        const y = midY - 4 + j;
        w.px(x, y, M.TUBE_K);
        if (lit) w.pxLight(x, y, N.CYAN, S.g);
      }
    });
    // The pharmacy cross pulses
    const C = w.cross;
    if (w.levels[C.g] > 0.5) {
      const p = Math.floor(w.t * 1.6) % 3;
      if (p === 0) {
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) if ((i > 2 && i < 6) || (j > 2 && j < 6)) w.pxLight(C.x + i, C.y + j, N.GREEN, C.g);
        }
      }
    }
  }

  function drawLaundry(w, wind) {
    w.laundry.forEach((L, n) => {
      const span = L.x1 - L.x0;
      const belly = 1.5 + Math.sin(w.t * 0.9 + n) * 0.4 * wind;
      for (let i = 0; i <= span; i++) {
        const t = i / span;
        const y = Math.round(mix(L.y0, L.y1, t) + 4 * belly * t * (1 - t));
        w.px(L.x0 + i, y, M.STONE_K);
      }
      L.items.forEach(([at, W, H, m], k) => {
        const t = at / span;
        const y = Math.round(mix(L.y0, L.y1, t) + 4 * belly * t * (1 - t));
        for (let j = 1; j <= H; j++) {
          const lift = Math.sin(w.t * 2 + k + at) * 0.25 * wind;
          const dx = Math.round((j / H) * lift * 3);
          for (let i = 0; i < W; i++) w.px(L.x0 + at + i + dx, y + j, j === H && i % 2 ? M.SHEET_S : m);
        }
      });
    });
  }

  function drawBunting(w, wind) {
    const cols = [M.BUNT_R, M.BUNT_Y, M.BUNT_G, M.BUNT_B, M.BUNT_P];
    const on = w.dark > 0.45;
    w.bunting.forEach((B, n) => {
      const span = B.x1 - B.x0;
      for (let i = 0; i <= span; i++) {
        const t = i / span;
        const y = Math.round(mix(B.y0, B.y1, t) + B.sag * 4 * t * (1 - t) + Math.sin(w.t * 1.1 + n) * 0.3);
        w.px(B.x0 + i, y, M.WIRE);
        if (i % 4 === 0) {
          const c = cols[(i / 4 + n) % cols.length];
          const flick = Math.sin(w.t * 3 + i) * 0.3 * wind;
          w.px(B.x0 + i, y + 1, c);
          w.px(B.x0 + i + 1, y + 1, c);
          w.px(B.x0 + i + Math.round(flick), y + 2, c);
          if (on && i % 8 === 0) w.pxLight(B.x0 + i + 2, y, N.BULB, 2);
        }
      }
    });
  }

  function drawGrills(w, dt, hurry) {
    const on = w.dark > 0.2;
    for (const G of w.grills) {
      w.rect(G.x - 4, G.y, 9, 1, M.IRON);
      w.rect(G.x - 4, G.y + 1, 9, 2, M.IRON_L);
      w.px(G.x - 3, G.y + 3, M.IRON);
      w.px(G.x + 3, G.y + 3, M.IRON);
      w.px(G.x - 3, G.y + 4, M.IRON);
      w.px(G.x + 3, G.y + 4, M.IRON);
      for (let i = -3; i < 3; i += 2) {
        w.px(G.x + i, G.y - 1, M.STEEL_S);
        w.px(G.x + i + 1, G.y - 1, M.STEEL_R);
      }
      for (let i = -3; i <= 3; i++) if ((Math.floor(w.t * 5) + i) % 3 === 0) w.pxLight(G.x + i, G.y + 1, N.EMBER, 1);
      // Griller, tongs going
      const hx = G.x + 6;
      w.rect(hx, G.y - 5, 3, 5, M.SHIRT);
      w.rect(hx, G.y, 3, 4, M.JEAN);
      w.rect(hx, G.y - 8, 3, 3, M.SKIN);
      w.rect(hx, G.y - 8, 3, 1, M.HAIR);
      if (Math.sin(w.t * 1.7 + G.x) > 0) w.px(hx - 1, G.y - 3, M.SKIN);
      else w.px(hx - 1, G.y - 2, M.SKIN);
    }
    for (let i = 0; i < w.smoke.length; i++) {
      const s = w.smoke[i];
      const G = w.grills[i % w.grills.length];
      s.a += dt * 0.28;
      if (s.a >= 1 || s.y === -99) {
        s.a %= 1;
        s.x = G.x + w.rand() * 4 - 2;
        s.y = G.y - 2;
        s.seed = w.rand() * 6;
      }
      s.y -= dt * 7;
      s.x += dt * (1.3 + hurry * 18 + Math.sin(w.t * 1.4 + s.seed) * 1.8);
      if (s.a > 0.85 && i % 2) continue;
      const px = Math.round(s.x);
      const py = Math.round(s.y);
      if ((px + py) % 2 === 0 || s.a < 0.4) w.px(px, py, M.SMOKE);
      if (s.a > 0.35 && s.a < 0.7) w.px(px + 1, py, M.SMOKE);
    }
  }

  function drawTuks(w, dt, night) {
    const beams = [];
    for (const K of w.tuks) {
      K.x += K.dir * K.v * dt;
      if (K.x > 372) K.x = -60;
      if (K.x < -60) K.x = 372;
      const x = Math.round(K.x);
      const flip = K.dir < 0;
      const L = 19;
      const col = (i) => (flip ? x + L - 1 - i : x + i);
      const y = 147;
      const bob = Math.round(Math.sin(K.x * 0.9) * 0.45);
      for (let i = 0; i < L; i++) {
        // Canopy, fringed
        if (i > 1 && i < 16) {
          w.px(col(i), y - 15 + bob, K.body);
          w.px(col(i), y - 14 + bob, K.body);
          if (i % 2) w.px(col(i), y - 13 + bob, M.SHEET);
        }
        // Tub, with its nose pulled down at the front
        const top = i > 15 ? y - 4 - (18 - i) : y - 6;
        for (let j = top; j <= y - 2; j++) w.px(col(i), j + bob, j === y - 2 ? M.TRAM_K : j === y - 4 && i < 15 ? M.SHEET : K.body);
      }
      w.rect(col(2), y - 13 + bob, 1, 7, M.IRON);
      w.rect(col(15), y - 13 + bob, 1, 3, M.IRON);
      w.px(col(16), y - 11 + bob, M.GLASS_HI);
      w.px(col(16), y - 10 + bob, M.GLASS_HI);
      w.px(col(16), y - 9 + bob, M.GLASS_HI);
      w.px(col(17), y - 8 + bob, M.GLASS_HI);
      for (const [c, m] of [
        [5, M.TOUR_A],
        [8, M.TOUR_C],
        [13, M.SHIRT],
      ]) {
        w.rect(col(c), y - 8 + bob, 2, 2, m);
        w.rect(col(c), y - 10 + bob, 2, 2, M.SKIN);
        w.rect(col(c), y - 11 + bob, 2, 1, M.HAIR);
      }
      for (const c of [3, 4, 5, 14, 15, 16]) {
        w.px(col(c), y, M.TIRE);
        w.px(col(c), y - 1, M.TIRE);
      }
      if (w.dark > 0.3) {
        w.pxLight(col(18), y - 3 + bob, N.HEAD);
        w.pxLight(col(0), y - 4 + bob, N.TAIL);
        beams.push([flip ? x - 1 : x + L, y - 1, K.dir]);
      }
    }
    w.beams = beams;
  }

  function drawCrowd(w, hour) {
    // Everybody in Lisbon knows where to be at this hour
    const come = smooth(16.6, 18.4, hour) * (1 - smooth(19.3, 20.2, hour));
    if (come <= 0) return;
    const spots = [
      [172, M.BLACK, M.TOUR_A],
      [164, M.JEAN, M.TOUR_B],
      [160, M.BLACK, M.SHIRT],
      [176, M.SHORTS, M.TOUR_C],
      [153, M.JEAN, M.SHIRT],
      [183, M.BLACK, M.BUNT_P],
      [145, M.BLACK, M.SUIT],
      [139, M.JEAN, M.TOUR_A],
    ];
    const n = Math.round(come * spots.length);
    for (let i = 0; i < n; i++) {
      const [x, leg, top] = spots[i];
      const y = 131 + (i % 2);
      const px = x + Math.round(Math.sin(w.t * 0.5 + i * 2) * 0.6);
      w.rect(px, y - 2, 3, 3, leg);
      w.rect(px, y - 6, 3, 4, top);
      w.rect(px, y - 9, 3, 3, M.HAIR);
    }
  }

  function drawGinjinha(w, hour) {
    const quiet = hour > 27.5 && hour < 31;
    const spots = [
      [206, M.SUIT, M.TOUR_A, 0],
      [226, M.JEAN, M.SHIRT, 2.2],
      [229, M.BLACK, M.TOUR_C, 4.1],
      [200, M.JEAN, M.TOUR_B, 1.3],
    ];
    spots.forEach(([x, leg, top, p], i) => {
      if (quiet && i) return;
      if (hour < 16 && i > 1) return;
      const y = FG(x) + 3;
      w.rect(x, y - 2, 3, 3, leg);
      w.rect(x, y - 6, 3, 4, top);
      w.rect(x, y - 9, 3, 3, M.SKIN);
      w.rect(x, y - 9, 3, 1, M.HAIR);
      // A small glass, in chocolate or not, and always a little raised
      const up = Math.sin(w.t * 0.8 + p) > 0.55;
      const hand = x + (i % 2 ? -1 : 3);
      w.px(hand, y - (up ? 7 : 5), M.SKIN);
      w.px(hand, y - (up ? 8 : 6), M.ROSE);
    });
  }

  function drawGulls(w, dt, hurry, night) {
    w.gulls.forEach((g, i) => {
      if (g.scare > 0) g.scare -= dt;
      const scared = g.scare > 0;
      if (night && i % 3) return;
      if (g.perch && !scared) {
        const [x, y] = g.perch;
        w.px(x, y, M.GULL);
        w.px(x + 1, y, M.GULL);
        w.px(x + 1, y - 1, M.GULL);
        w.px(x - 1, y, M.GULL_D);
        return;
      }
      if (g.perch && scared && !g.flying) {
        g.flying = true;
        g.x = g.perch[0];
        g.y = g.perch[1];
      }
      if (g.perch && !scared) g.flying = false;
      const speed = scared ? 26 : 1;
      g.x += g.v * dt * speed * (scared ? 0.5 : 1);
      g.y += (scared ? -22 : Math.sin(w.t * 0.7 + g.p) * 1.2) * dt + (scared ? 0 : (34 - g.y) * 0.01 * dt);
      if (g.y < -30) g.y = -30;
      if (!scared && g.y < 12) g.y += dt * 7;
      if (g.x > 240) g.x = 90;
      if (g.x < 90) g.x = 240;
      const x = Math.round(g.x);
      const y = Math.round(g.y);
      const flap = Math.sin(w.t * (scared ? 16 : 6) + g.p) > 0;
      w.px(x, y, M.GULL);
      w.px(x + 1, y, M.GULL);
      if (flap) {
        w.px(x - 1, y - 1, M.GULL);
        w.px(x + 2, y - 1, M.GULL);
        w.px(x - 2, y - 2, M.GULL_D);
        w.px(x + 3, y - 2, M.GULL_D);
      } else {
        w.px(x - 1, y + 1, M.GULL);
        w.px(x + 2, y + 1, M.GULL);
        w.px(x - 2, y + 1, M.GULL_D);
        w.px(x + 3, y + 1, M.GULL_D);
      }
    });
  }

  // Sun or moon on the Tejo: a road of broken light, wider near the eye
  function drawGlitter(w, hour) {
    const sun = sunAt(hour);
    const moon = moonAt(hour);
    const sh = w.shimmer;
    const tick = Math.floor(w.t * 6);
    const lay = (cx, spread, r, g, b, density, emit) => {
      for (let y = HORIZON + 1; y < WATER_END; y++) {
        const dy = y - HORIZON;
        const half = 1.5 + dy * spread;
        const n = Math.ceil(half * density * 0.3);
        for (let s = 0; s < n; s++) {
          const a = sh[(s * 53 + y * 17 + (tick + s * 3) * 3) & 1023];
          const c = sh[(s * 11 + y * 71 + (tick + s) * 5) & 1023];
          const x0 = Math.round(cx + ((a + c * 0.3) / 3.9) * half) + PAD_X;
          const len = 1 + (Math.abs(c) >> 1);
          const by = y + PAD_Y;
          for (let d = 0; d < len; d++) {
            const x = x0 + d;
            if (x < 0 || x >= BW || by >= BH) continue;
            const i = by * BW + x;
            const m = w.fmat[i];
            if (m !== M.RIVER && m !== M.RIVER_D && m !== M.RIVER_L) continue;
            const k = i * 4;
            w.rgba[k] = Math.min(255, w.rgba[k] + r);
            w.rgba[k + 1] = Math.min(255, w.rgba[k + 1] + g);
            w.rgba[k + 2] = Math.min(255, w.rgba[k + 2] + b);
            w.emit[k] = Math.max(w.emit[k], r * emit);
            w.emit[k + 1] = Math.max(w.emit[k + 1], g * emit);
            w.emit[k + 2] = Math.max(w.emit[k + 2], b * emit);
            w.emit[k + 3] = 255;
          }
        }
      }
    };
    if (sun && hour < 19.8) {
      const low = smooth(15.5, 18.4, hour);
      const fade = 1 - smooth(19.2, 19.7, hour);
      lay(sun.x, mix(0.5, 0.9, low), mix(90, 115, low) * fade, mix(90, 72, low) * fade, mix(80, 16, low) * fade, mix(0.6, 1.3, low), mix(0.08, 0.2, low));
    } else if (moon) {
      lay(moon.x, 0.42, 46, 50, 46, 0.9, 0.08);
    }
  }

  CitySwitch.define('lisbon-switch', scene);
})();
