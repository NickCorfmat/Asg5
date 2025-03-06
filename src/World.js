import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

let scene, camera, renderer, cube;

export function main() {
  const canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 5;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.z = 2;

  scene = new THREE.Scene();

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;

  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

  cube = new THREE.Mesh(geometry, material);

  scene.add(cube);

  renderer.render(scene, camera);

  const color = 0xffffff;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
}

function render(time) {
  time *= 0.001;

  cube.rotation.x = time;
  cube.rotation.y = time;

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);