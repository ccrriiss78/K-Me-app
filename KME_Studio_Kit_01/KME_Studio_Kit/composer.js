(function (scope) {
  const categories = ['bodies', 'faces', 'eyes', 'mouths', 'hair', 'poses', 'emotions'];
  const defaults = {
    bodies: 'wide', faces: 'long', eyes: 'almond', mouths: 'soft',
    hair: 'sweep', poses: 'concert', emotions: 'neutral',
  };

  function normalize(manifest, input = {}) {
    return Object.fromEntries(categories.map(key => {
      const id = input?.[key];
      return [key, manifest[key].some(option => option.id === id) ? id : defaults[key]];
    }));
  }

  function compose(manifest, assets, input) {
    const state = normalize(manifest, input);
    const [body, face, eyes, mouth, hair, , emotion] = categories.map(
      key => manifest[key].find(option => option.id === state[key])
    );
    const [arms, poseAccent] = body.poses[state.poses];
    const art = file => {
      if (!Object.hasOwn(assets, file)) throw new Error('Falta la pieza ' + file);
      return assets[file];
    };
    const place = (file, [x, y], extra = '') =>
      '<g transform="translate(' + x + ' ' + y + ') ' + extra + '">' + art(file) + '</g>';
    const [width, height] = manifest.canvas;
    const eyeScale = emotion.eyeScale ?? [1, 1];
    const layers = {
      hairBack: art(hair.back),
      legs: art(body.legs),
      shoes: art(body.shoes),
      neck: art(body.neck),
      arms: art(arms),
      torso: art(body.torso),
      face: art(face.file),
      cheeks: emotion.cheek
        ? face.anchors.eyes.map(([x, y], i) =>
          place(emotion.cheek, [x + (i ? 6 : -6), y + 13]).replaceAll('wash', 'wash-' + i)
        ).join('') : '',
      eyes: face.anchors.eyes.map((point, i) =>
        place(eyes.file, point, 'scale(' + (i ? -eyeScale[0] : eyeScale[0]) + ' ' + eyeScale[1] + ')')
      ).join(''),
      brows: face.anchors.brows.map((point, i) =>
        place(eyes.brow, point, (i ? 'scale(-1 1) ' : '') + (emotion.id === 'sad' ? 'rotate(15)' : ''))
      ).join(''),
      tears: emotion.tear
        ? face.anchors.eyes.map(([x, y]) => place(emotion.tear, [x, y + 2])).join('') : '',
      mouth: place(mouth.file, face.anchors.mouth),
      hairFront: art(hair.front),
      poseAccent: art(poseAccent),
      emotionAccent: emotion.outer ? art(emotion.outer) : '',
    };
    const drawing = manifest.layerOrder.map(
      layer => '<g data-layer="' + layer + '">' + layers[layer] + '</g>'
    ).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height
      + '" width="' + width + '" height="' + height + '" role="img" aria-label="Avatar K-ME Studio">'
      + drawing + '</svg>';
  }

  scope.KMEAvatar = { categories, defaults, normalize, compose };
})(globalThis);
