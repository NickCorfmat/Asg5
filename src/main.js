import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";

/*
Sources:
- https://threejs.org/manual/#en/fundamentals
- https://threejs.org/manual/#en/textures
- https://threejs.org/manual/#en/load-obj
*/

const objLoader = new OBJLoader();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

export function main() {
  // Initialize Renderer
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Initialize Camera
  const fov = 45;
  const aspect = 2;
  const near = 0.001;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-6.6, 4, 7);

  // Initialize Controls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);

  // Initialize Scene
  const scene = new THREE.Scene();

  // Add Spotlight
  {
    const spotlight = new THREE.SpotLight(
      0xffffff,
      10,
      100,
      Math.PI / 4,
      0.2,
      0.5
    );
    spotlight.target.position.set(0, 0, 0);
    spotlight.castShadow = true;
    scene.add(spotlight);
  }

  // Add Ambient Light
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
  }

  // Add Ground Plane
  {
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    groundGeometry.rotateX(-Math.PI / 2);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      side: THREE.DoubleSide,
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    groundMesh.position.set(0, -0.1, 0);
    scene.add(groundMesh);
  }

  // Add Skybox
  {
    textureLoader.load("../assets/images/skybox.jpg", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    });
  }

  // Add Tumbler
  {
    gltfLoader.setPath("../assets/models/tumbler/");
    gltfLoader.load("scene.gltf", (gltf) => {
      const mesh = gltf.scene;

      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      mesh.position.set(0, 0, 0);
      mesh.scale.set(0.27, 0.27, 0.27);
      scene.add(mesh);
    });
  }

  // Add roads
  {
    gltfLoader.setPath("../assets/models/road/");
    gltfLoader.load("road.gltf", (gltf) => {
      const mesh = gltf.scene;

      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      mesh.position.set(-2, 0, 18);
      scene.add(mesh);
    });
  }

  // Skyscrapers
  {
    const map = [
      [3, 5, 4, 3, 3],
      [4, 3, 5, 3, 5],
      [3, 4, 3, 5, 4],
      [5, 3, 4, 4, 3],
      [3, 4, 4, 3, 4],
    ];

    const size = 10;
    const gap = 20;
    const geometry = new THREE.BoxGeometry(size, size, size);

    const texture = textureLoader.load("../assets/images/offices.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });

    for (let x = 0; x < map[0].length; x++) {
      for (let z = 0; z < map.length; z++) {
        const numStories = map[x][z];

        for (let i = 0; i < numStories; i++) {
          const building = new THREE.Mesh(geometry, material);

          const xOffset = x * (size + gap);
          const zOffset = z * (size + gap);

          building.position.set(xOffset, i * size + 5, zOffset);
          scene.add(building);
        }
      }
    }
  }

  // Resize Renderer to Fit Display
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // Render Loop
  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
