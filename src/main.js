import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/*
Sources:
- https://threejs.org/manual/#en/fundamentals
- https://threejs.org/manual/#en/textures
- https://threejs.org/manual/#en/load-obj
- Importing glTF models - https://youtu.be/aOQuuotM-Ww?feature=shared
- Fog - https://youtu.be/k1zGz55EqfU?feature=shared
*/

const objLoader = new OBJLoader();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const mtlLoader = new MTLLoader();

let startTime = performance.now() / 1000.0;
let seconds = performance.now() / 1000.0 - startTime;

let newsCameraXYZ = computeNewsCameraXYZ();

function computeNewsCameraXYZ() {
  const x = 33 * Math.cos(seconds / 3);
  const z = 33 * Math.sin(seconds / 3);
  const y = 35 + 5 * Math.sin(seconds / 3);

  return { x: x, y: y, z: z };
}

export function main() {
  // Initialize Renderer
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Initialize Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbadbe6, 20, 200);

  // Initialize Camera
  const fov = 45;
  const aspect = 2;
  const near = 0.001;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(15.3, 10.8, 16);

  const newsCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  newsCamera.position.set(newsCameraXYZ.x, newsCameraXYZ.y, newsCameraXYZ.z);
  newsCamera.lookAt(0, 0, 0);
  scene.add(newsCamera);

  // Initialize Controls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);

  // Spotlight
  {
    const spotlight = new THREE.SpotLight(0xe6fffe, 400, 50, degToRad(20), 0.3);

    spotlight.position.set(5, 10, 12);
    spotlight.target.position.set(0, 0, 0);
    spotlight.castShadow = true;

    scene.add(spotlight);
  }

  // Ambient Light
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
  }

  // Directional Light
  {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(200, 200, 200);
    directionalLight.castShadow = true;

    // Directional light configurations provided by ChatGPT
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;

    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;

    scene.add(directionalLight);
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
      const scale = 0.28;

      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      mesh.position.set(0, 0, 1);
      mesh.rotation.y = degToRad(2);
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
    });
  }

  // Police Car
  // Source: https://sketchfab.com/3d-models/los-angeles-police-department-car-795fa0620bc44db8afcb06720a4dadd7
  {
    gltfLoader.load("../assets/models/police/police.gltf", (gltf) => {
      const mesh = gltf.scene;
      const scale = 1;
      mesh.scale.set(scale, scale, scale);

      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const instances = [
        { x: -1, z: -20, rotation: degToRad(5) },
        { x: 3, z: -30, rotation: degToRad(-5) },
        { x: -1, z: -40, rotation: degToRad(-2) },
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
  }

  // Intersection
  // Source: https://www.cgtrader.com/products/road-junction-67b99834-9654-4fb4-90f0-e2b827d3b56f
  {
    gltfLoader.load(
      "../assets/models/intersection/intersection.gltf",
      (gltf) => {
        const mesh = gltf.scene;

        mesh.traverse((child) => {
          if (child.isMesh) {
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
      mesh.receiveShadow = true;

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

        instance.receiveShadow = true;

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

      // Enable lighting on materials code provided by ChatGPT
      for (const materialName in mtl.materials) {
        const material = mtl.materials[materialName];
        material.side = THREE.DoubleSide;

        mtl.materials[materialName] = new THREE.MeshStandardMaterial({
          color: material.color || 0xffffff,
          map: material.map,
          side: THREE.DoubleSide,
        });
      }

      objLoader.load("../assets/models/city/city.obj", (mesh) => {
        const instances = [
          { x: 105, z: 0, rotation: degToRad(270) },
          { x: -115, z: 100, rotation: degToRad(360) },
          { x: 0, z: 150, rotation: degToRad(72) },
          { x: -50, z: -100, rotation: degToRad(540) },
        ];

        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

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

        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

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

    const numCones = 11;

    for (let i = 0; i < numCones; i++) {
      const cone1 = new THREE.Mesh(geometry, material);
      cone1.castShadow = true;
      cone1.receiveShadow = true;
      cone1.position.set(startX1, 0.3, startZ + i * gap);
      cone1.scale.set(scale, scale, scale);
      scene.add(cone1);

      const cone2 = new THREE.Mesh(geometry, material);
      cone2.castShadow = true;
      cone2.receiveShadow = true;
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

      crate.castShadow = true;
      crate.receiveShadow = true;

      crate.position.set(x, y + 0.4, z);
      crate.rotation.y = rotation;

      scene.add(crate);
    }
  }

  function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function animateScene() {
    newsCameraXYZ = computeNewsCameraXYZ();

    newsCamera.position.set(newsCameraXYZ.x, newsCameraXYZ.y, newsCameraXYZ.z);
    newsCamera.lookAt(0, 0, 0);
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
    seconds = performance.now() / 1000.0 - startTime;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    controls.update();

    renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    const minimapSize = 300;
    const paddingX = 40;
    const paddingY = 20;
    renderer.setViewport(
      paddingX,
      canvas.clientHeight - minimapSize - paddingY,
      (16 / 11) * minimapSize + paddingX,
      minimapSize - paddingY
    );
    renderer.setScissor(
      paddingX,
      canvas.clientHeight - minimapSize - paddingY,
      (16 / 11) * minimapSize + paddingX,
      minimapSize - paddingY
    );
    renderer.setScissorTest(true);
    renderer.render(scene, newsCamera);

    animateScene();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
