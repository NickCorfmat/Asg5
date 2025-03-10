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
const mtlLoader = new MTLLoader();

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
    const size = 300;
    const groundGeometry = new THREE.PlaneGeometry(size, size, 32, 32);
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
  // Source: https://sketchfab.com/3d-models/the-batman-begin-tumbler-83b64fe11adc43dba84a3f27aa0e7ec1
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
  // Source: https://sketchfab.com/3d-models/low-poly-city-buildings-e0209ac5bb684d2d85e5ade96c92d2ff
  {
    const scale = 60;

    mtlLoader.load("../assets/models/city/city.mtl", (mtl) => {
      mtl.preload();
      objLoader.setMaterials(mtl);
      for (const material of Object.values(mtl.materials)) {
        material.side = THREE.DoubleSide;
      }
      objLoader.load("../assets/models/city/city.obj", (mesh) => {
        mesh.scale.set(scale, scale, scale);
        mesh.position.set(105, 0, 0);
        mesh.rotation.y = (3 * Math.PI) / 2;
        scene.add(mesh);

        const mirroredMesh = mesh.clone();
        mirroredMesh.scale.x *= -1;
        mirroredMesh.position.set(-105, 0, 0);
        scene.add(mirroredMesh);
      });
    });
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
