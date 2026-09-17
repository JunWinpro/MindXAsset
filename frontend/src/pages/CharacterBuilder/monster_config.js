export const monsterSkeletons = {
  A: { 
    center: {x: 82, y: 82},
    arm_L: {x: 10, y: 80}, arm_R: {x: 155, y: 80}, 
    leg_L: {x: 40, y: 140}, leg_R: {x: 125, y: 140}, 
    face: {x: 82, y: 70}, 
    detail_L: {x: 30, y: 10}, detail_R: {x: 135, y: 10} 
  },
  B: { 
    center: {x: 96, y: 96},
    arm_L: {x: 10, y: 96}, arm_R: {x: 182, y: 96}, 
    leg_L: {x: 50, y: 165}, leg_R: {x: 142, y: 165}, 
    face: {x: 96, y: 80}, 
    detail_L: {x: 40, y: 10}, detail_R: {x: 152, y: 10} 
  },
  C: { 
    center: {x: 70, y: 97},
    arm_L: {x: 10, y: 90}, arm_R: {x: 131, y: 90}, 
    leg_L: {x: 30, y: 165}, leg_R: {x: 111, y: 165}, 
    face: {x: 70, y: 70}, 
    detail_L: {x: 20, y: 10}, detail_R: {x: 121, y: 10} 
  },
  D: { 
    center: {x: 87, y: 91},
    arm_L: {x: 10, y: 90}, arm_R: {x: 164, y: 90}, 
    leg_L: {x: 40, y: 155}, leg_R: {x: 134, y: 155}, 
    face: {x: 87, y: 80}, 
    detail_L: {x: 30, y: 10}, detail_R: {x: 144, y: 10} 
  },
  E: { 
    center: {x: 66, y: 125},
    arm_L: {x: 10, y: 100}, arm_R: {x: 122, y: 100}, 
    leg_L: {x: 30, y: 220}, leg_R: {x: 102, y: 220}, 
    face: {x: 66, y: 80}, 
    detail_L: {x: 20, y: 10}, detail_R: {x: 112, y: 10} 
  },
  F: { 
    center: {x: 85, y: 118},
    arm_L: {x: 15, y: 120}, arm_R: {x: 155, y: 120}, 
    leg_L: {x: 40, y: 210}, leg_R: {x: 130, y: 210}, 
    face: {x: 85, y: 80}, 
    detail_L: {x: 30, y: 10}, detail_R: {x: 140, y: 10} 
  },
};

const createOptions = (prefix, types) => {
  return types.map(t => ({
    id: `${prefix}_${t}`,
    name: `${prefix} ${t}`.toUpperCase(),
    src: `/assets/monster/${prefix}_${t}.png`
  }));
};

const createNoUnderscoreOptions = (prefix, types) => {
  return types.map(t => ({
    id: `${prefix}${t}`,
    name: `${prefix} ${t}`.toUpperCase(),
    src: `/assets/monster/${prefix}${t}.png`
  }));
}

export const monsterConfig = {
  body: createOptions('body', [
    'blueA', 'blueB', 'blueC', 'blueD', 'blueE', 'blueF',
    'greenA', 'greenB', 'greenC', 'greenD', 'greenE', 'greenF',
    'redA', 'redB', 'redC', 'redD', 'redE', 'redF',
    'yellowA', 'yellowB', 'yellowC', 'yellowD', 'yellowE', 'yellowF',
    'darkA', 'darkB', 'darkC', 'darkD', 'darkE', 'darkF',
    'whiteA', 'whiteB', 'whiteC', 'whiteD', 'whiteE', 'whiteF'
  ]),
  arm: createOptions('arm', [
    'blueA', 'blueB', 'blueC', 'blueD', 'blueE',
    'greenA', 'greenB', 'greenC', 'greenD', 'greenE',
    'redA', 'redB', 'redC', 'redD', 'redE',
    'yellowA', 'yellowB', 'yellowC', 'yellowD', 'yellowE',
    'darkA', 'darkB', 'darkC', 'darkD', 'darkE',
    'whiteA', 'whiteB', 'whiteC', 'whiteD', 'whiteE'
  ]),
  leg: createOptions('leg', [
    'blueA', 'blueB', 'blueC', 'blueD', 'blueE',
    'greenA', 'greenB', 'greenC', 'greenD', 'greenE',
    'redA', 'redB', 'redC', 'redD', 'redE',
    'yellowA', 'yellowB', 'yellowC', 'yellowD', 'yellowE',
    'darkA', 'darkB', 'darkC', 'darkD', 'darkE',
    'whiteA', 'whiteB', 'whiteC', 'whiteD', 'whiteE'
  ]),
  eye: [
    ...createOptions('eye', ['blue', 'red', 'yellow', 'dead']),
    { id: 'eye_angry_blue', name: 'Angry Blue', src: '/assets/monster/eye_angry_blue.png' },
    { id: 'eye_angry_green', name: 'Angry Green', src: '/assets/monster/eye_angry_green.png' },
    { id: 'eye_angry_red', name: 'Angry Red', src: '/assets/monster/eye_angry_red.png' },
    { id: 'eye_cute_dark', name: 'Cute Dark', src: '/assets/monster/eye_cute_dark.png' },
    { id: 'eye_cute_light', name: 'Cute Light', src: '/assets/monster/eye_cute_light.png' },
    { id: 'eye_human', name: 'Human', src: '/assets/monster/eye_human.png' },
    { id: 'eye_human_blue', name: 'Human Blue', src: '/assets/monster/eye_human_blue.png' },
    { id: 'eye_human_green', name: 'Human Green', src: '/assets/monster/eye_human_green.png' },
    { id: 'eye_human_red', name: 'Human Red', src: '/assets/monster/eye_human_red.png' },
    { id: 'eye_psycho_dark', name: 'Psycho Dark', src: '/assets/monster/eye_psycho_dark.png' },
    { id: 'eye_psycho_light', name: 'Psycho Light', src: '/assets/monster/eye_psycho_light.png' },
    { id: 'eye_closed_feminine', name: 'Closed Fem', src: '/assets/monster/eye_closed_feminine.png' },
    { id: 'eye_closed_happy', name: 'Closed Happy', src: '/assets/monster/eye_closed_happy.png' },
  ],
  mouth: [
    ...createNoUnderscoreOptions('mouth', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']),
    { id: 'mouth_closed_fangs', name: 'Closed Fangs', src: '/assets/monster/mouth_closed_fangs.png' },
    { id: 'mouth_closed_happy', name: 'Closed Happy', src: '/assets/monster/mouth_closed_happy.png' },
    { id: 'mouth_closed_sad', name: 'Closed Sad', src: '/assets/monster/mouth_closed_sad.png' },
    { id: 'mouth_closed_teeth', name: 'Closed Teeth', src: '/assets/monster/mouth_closed_teeth.png' },
  ],
  nose: [
    ...createOptions('nose', ['brown', 'green', 'red', 'yellow']),
    { id: 'snot_large', name: 'Snot Large', src: '/assets/monster/snot_large.png' },
    { id: 'snot_small', name: 'Snot Small', src: '/assets/monster/snot_small.png' },
  ],
  eyebrow: createNoUnderscoreOptions('eyebrow', ['A', 'B', 'C']),
  detail: [
    { id: 'detail_blue_horn_large', name: 'Horn Large', src: '/assets/monster/detail_blue_horn_large.png' },
    { id: 'detail_blue_horn_small', name: 'Horn Small', src: '/assets/monster/detail_blue_horn_small.png' },
    { id: 'detail_blue_ear', name: 'Ear', src: '/assets/monster/detail_blue_ear.png' },
    { id: 'detail_blue_ear_round', name: 'Ear Round', src: '/assets/monster/detail_blue_ear_round.png' },
    { id: 'detail_blue_antenna_large', name: 'Antenna L', src: '/assets/monster/detail_blue_antenna_large.png' },
    { id: 'detail_blue_antenna_small', name: 'Antenna S', src: '/assets/monster/detail_blue_antenna_small.png' },
  ]
};

// Helper to determine pivot based on asset name pattern
const getArmPivot = (armId) => {
  if (armId.endsWith('C') || armId.endsWith('D') || armId.endsWith('E')) {
    return { x: 0.5, y: 0.9 }; // Khớp vai ở phía dưới của ảnh
  }
  return { x: 0.5, y: 0.1 }; // Khớp vai ở phía trên
};

export const getMonsterLayers = (selections) => {
  const layers = [];
  
  const bodyId = selections.body || 'body_blueA';
  const shape = bodyId.slice(-1);
  const skeleton = monsterSkeletons[shape] || monsterSkeletons['A'];
  
  const getOpt = (cat) => {
    if (!selections[cat]) return null;
    return monsterConfig[cat].find(o => o.id === selections[cat]);
  };

  const bodyOpt = getOpt('body');
  const armOpt = getOpt('arm');
  const legOpt = getOpt('leg');
  const eyeOpt = getOpt('eye');
  const mouthOpt = getOpt('mouth');
  const noseOpt = getOpt('nose');
  const eyebrowOpt = getOpt('eyebrow');
  const detailOpt = getOpt('detail');

  const bodyCenter = skeleton.center;

  // Body layer (gốc)
  if (bodyOpt) {
    layers.push({
      id: bodyOpt.id,
      category: 'body',
      src: bodyOpt.src,
      z_index: 0,
      position: { x: 0, y: 0 },
      pivot: { x: 0, y: 0 },
      bodyCenter: bodyCenter
    });
  }

  // Chân
  if (legOpt) {
    layers.push({
      id: legOpt.id + '_L',
      category: 'leg_L',
      src: legOpt.src,
      z_index: -2,
      position: skeleton.leg_L,
      pivot: { x: 0.5, y: 0.1 },
      scaleX: -1,
      bodyCenter: bodyCenter
    });
    layers.push({
      id: legOpt.id + '_R',
      category: 'leg_R',
      src: legOpt.src,
      z_index: -2,
      position: skeleton.leg_R,
      pivot: { x: 0.5, y: 0.1 },
      scaleX: 1,
      bodyCenter: bodyCenter
    });
  }

  // Tay
  if (armOpt) {
    const armPivot = getArmPivot(armOpt.id);
    layers.push({
      id: armOpt.id + '_L',
      category: 'arm_L',
      src: armOpt.src,
      z_index: -3,
      position: skeleton.arm_L,
      pivot: armPivot, 
      scaleX: -1,
      bodyCenter: bodyCenter
    });
    layers.push({
      id: armOpt.id + '_R',
      category: 'arm_R',
      src: armOpt.src,
      z_index: -3,
      position: skeleton.arm_R,
      pivot: armPivot,
      scaleX: 1,
      bodyCenter: bodyCenter
    });
  }

  // Mặt
  if (mouthOpt) {
    layers.push({
      id: mouthOpt.id,
      category: 'mouth',
      src: mouthOpt.src,
      z_index: 1,
      position: { x: skeleton.face.x, y: skeleton.face.y + 40 },
      pivot: { x: 0.5, y: 0.5 },
      bodyCenter: bodyCenter
    });
  }

  if (noseOpt) {
    const isSnot = noseOpt.id.includes('snot');
    layers.push({
      id: noseOpt.id,
      category: 'nose',
      src: noseOpt.src,
      z_index: 2, // Đặt dưới mắt để không che mắt
      position: { x: skeleton.face.x, y: skeleton.face.y + 15 },
      pivot: isSnot ? { x: 0.5, y: 0.1 } : { x: 0.5, y: 0.5 },
      bodyCenter: bodyCenter
    });
  }

  if (eyeOpt) {
    layers.push({
      id: eyeOpt.id,
      category: 'eye',
      src: eyeOpt.src,
      z_index: 3,
      position: skeleton.face,
      pivot: { x: 0.5, y: 0.5 },
      bodyCenter: bodyCenter
    });
  }
  
  if (eyebrowOpt) {
    layers.push({
      id: eyebrowOpt.id,
      category: 'eyebrow',
      src: eyebrowOpt.src,
      z_index: 4,
      position: { x: skeleton.face.x, y: skeleton.face.y - 25 },
      pivot: { x: 0.5, y: 0.5 },
      bodyCenter: bodyCenter
    });
  }

  // Sừng/Tai
  if (detailOpt) {
    const isEar = detailOpt.id.includes('ear');
    const detailPivot = isEar ? { x: 0.9, y: 0.5 } : { x: 0.5, y: 0.9 };
    
    layers.push({
      id: detailOpt.id + '_L',
      category: 'detail_L',
      src: detailOpt.src,
      z_index: -1,
      position: skeleton.detail_L,
      pivot: detailPivot,
      scaleX: -1,
      bodyCenter: bodyCenter
    });
    layers.push({
      id: detailOpt.id + '_R',
      category: 'detail_R',
      src: detailOpt.src,
      z_index: -1,
      position: skeleton.detail_R,
      pivot: detailPivot,
      scaleX: 1,
      bodyCenter: bodyCenter
    });
  }

  return layers;
};
