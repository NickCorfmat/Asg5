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
  scene.fog = new THREE.Fog(0xbadbe6, 20, 300);

  // Spotlight
  {
    const spotlight = new THREE.SpotLight(
      0xffffff,
      10,
      100,
      degToRad(45),
      0.2,
      0.5
    );
    spotlight.target.position.set(0, 0, 0);
    spotlight.castShadow = true;
    scene.add(spotlight);
  }

  // Ambient Light
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
  }

  // Ground Plane
  {
    const size = 500;

    const groundGeometry = new THREE.PlaneGeometry(size, size, 32, 32);
    groundGeometry.rotateX(degToRad(-90));

    const texture = textureLoader.load("../assets/images/sidewalk.png");

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(150, 150);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xb8b8b8,
      side: THREE.DoubleSide,
    });

    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    groundMesh.position.set(0, -0.1, 0);
    scene.add(groundMesh);
  }

  // Skybox
  {
    textureLoader.load("../assets/images/skybox.jpg", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    });
  }

  // Tumbler
  // Source: https://sketchfab.com/3d-models/the-batman-begin-tumbler-83b64fe11adc43dba84a3f27aa0e7ec1
  {
    gltfLoader.load("../assets/models/tumbler/scene.gltf", (gltf) => {
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

  // Intersection
  {
    gltfLoader.load(
      "../assets/models/intersection/intersection.gltf",
      (gltf) => {
        const mesh = gltf.scene;

        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        mesh.position.set(-2, 0, 18);
        scene.add(mesh);
      }
    );
  }

  // Roads
  // Source: https://sketchfab.com/3d-models/low-road-2-7cc26be9fba04f4ca29a76454bfe5dbb
  {
    const scale = 1.7;

    gltfLoader.load("../assets/models/road/road.gltf", (gltf) => {
      const mesh = gltf.scene;
      mesh.scale.set(scale, scale, scale);

      const instances = [
        { x: 0.7, z: 63, rotation: degToRad(0) }, // Front
        { x: 0.7, z: 80, rotation: degToRad(0) },
        { x: 0.7, z: -63, rotation: degToRad(0) }, // Back
        { x: 0.7, z: -80, rotation: degToRad(0) },
        { x: 0.7, z: -100, rotation: degToRad(0) },
        { x: 0.7, z: -120, rotation: degToRad(0) },
        { x: 63, z: 0.7, rotation: degToRad(270) }, // Left
        { x: 80, z: 0.7, rotation: degToRad(270) },
        { x: -63, z: 0.7, rotation: degToRad(270) }, // Right
        { x: -80, z: 0.7, rotation: degToRad(270) },
        { x: -100, z: 0.7, rotation: degToRad(270) },
        { x: -120, z: 0.7, rotation: degToRad(270) },
        { x: -140, z: 0.7, rotation: degToRad(270) },
      ];

      for (let i = 0; i < instances.length; i++) {
        const { x, z, rotation } = instances[i];
        const instance = mesh.clone();

        instance.scale.set(scale, scale, scale);
        instance.position.set(x, 0.01, z);
        instance.rotation.y = rotation;

        scene.add(instance);
      }
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
        const instances = [
          { x: 105, z: 0, rotation: degToRad(270) },
          { x: -115, z: 100, rotation: degToRad(360) },
          { x: 0, z: 150, rotation: degToRad(72) },
          { x: -50, z: -100, rotation: degToRad(540) },
        ];

        for (let i = 0; i < instances.length; i++) {
          const { x, z, rotation } = instances[i];
          const instance = mesh.clone();

          instance.scale.set(scale, scale, scale);
          instance.position.set(x, 0, z);
          instance.rotation.y = rotation;

          scene.add(instance);
        }
      });
    });
  }

  // London Building
  // Source: https://sketchfab.com/3d-models/free-london-kinnaird-house-ff13d8c9407f4796886a689a758dc862
  {
    const scale = 1.8;

    gltfLoader.load(
      "../assets/models/londonbuilding/londonbuilding.gltf",
      (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(scale, scale, scale);

        const instances = [
          { x: -25, z: -32, rotation: degToRad(90) },
          { x: 28, z: 35, rotation: degToRad(270) },
        ];

        for (let i = 0; i < instances.length; i++) {
          const { x, z, rotation } = instances[i];
          const instance = mesh.clone();

          instance.scale.set(scale, scale, scale);
          instance.position.set(x, -0.5, z);
          instance.rotation.y = rotation;

          scene.add(instance);
        }
      }
    );
  }

  // Traffic Cones
  {
    const scale = 0.04;

    const geometry = new THREE.ConeGeometry(5, 20, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xfab250 });

    const startX1 = 8.5;
    const startX2 = -7;
    const startZ = 12;
    const gap = 5;

    const numCones = 10;

    for (let i = 0; i < numCones; i++) {
      const cone1 = new THREE.Mesh(geometry, material);
      cone1.position.set(startX1, 0.3, startZ + i * gap);
      cone1.scale.set(scale, scale, scale);
      scene.add(cone1);

      const cone2 = new THREE.Mesh(geometry, material);
      cone2.position.set(startX2, 0.3, startZ + i * gap);
      cone2.scale.set(scale, scale, scale);
      scene.add(cone2);
    }
  }

  // Crates
  {
    const size = 0.8;
    const geometry = new THREE.BoxGeometry(size, size, size);

    const texture = textureLoader.load("../assets/images/crate.png");
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
    });

    const instances = [
      { x: 15, y: 0, z: -11, rotation: 0 },
      { x: 13, y: 0, z: -10, rotation: degToRad(15) },
      { x: 15, y: 0, z: -12.5, rotation: degToRad(50) },
      { x: -4, y: 0, z: -12, rotation: degToRad(25) },
      { x: -3.5, y: 0, z: -14, rotation: degToRad(45) },
      { x: -5.5, y: 0.12, z: -14, rotation: degToRad(35) },
      { x: 5, y: 0, z: -16, rotation: degToRad(35) },
      { x: 6.5, y: 0.12, z: -17.5, rotation: degToRad(15) },
    ];

    for (let i = 0; i < instances.length; i++) {
      const { x, y, z, rotation } = instances[i];
      const crate = new THREE.Mesh(geometry, material);

      crate.position.set(x, y + 0.4, z);
      crate.rotation.y = rotation;

      scene.add(crate);
    }
  }

  function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
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
