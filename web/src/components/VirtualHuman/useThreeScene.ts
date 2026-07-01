import * as THREE from 'three'
import { ref, onMounted, onUnmounted, type Ref, shallowRef } from 'vue'

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  const isReady = ref(false)
  const sceneRef = shallowRef<THREE.Scene | null>(null)

  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let animFrameId: number
  let holoRing1: THREE.Mesh, holoRing2: THREE.Mesh, holoRing3: THREE.Mesh
  let particles: THREE.Points
  const clock = new THREE.Clock()
  
  // Callbacks for custom animations
  const animationCallbacks: Array<(dt: number, elapsed: number) => void> = []

  function init() {
    const canvas = canvasRef.value
    if (!canvas) return

    // Scene
    const scene = new THREE.Scene()
    sceneRef.value = scene  // Store in ref

    // Camera (adjusted for futuristic avatar)
    camera = new THREE.PerspectiveCamera(
      50,
      canvas.parentElement!.clientWidth / canvas.parentElement!.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 0.2, 4.5)
    camera.lookAt(0, 0, 0)

    // Renderer with enhanced settings
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(canvas.parentElement!.clientWidth, canvas.parentElement!.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.8
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // === Futuristic Lighting Setup ===
    
    // Ambient light (cool blue)
    const ambient = new THREE.AmbientLight(0xe0f2fe, 0.7)
    scene.add(ambient)

    // Key light (bright white-blue)
    const key = new THREE.DirectionalLight(0xffffff, 2.5)
    key.position.set(2, 3, 4)
    key.castShadow = true
    key.shadow.mapSize.width = 1024
    key.shadow.mapSize.height = 1024
    key.shadow.bias = -0.0001
    scene.add(key)

    // Fill light (cyan accent)
    const fill = new THREE.DirectionalLight(0x0ea5e9, 1.2)
    fill.position.set(-3, 1, 2)
    scene.add(fill)

    // Rim light (silver highlight)
    const rim = new THREE.DirectionalLight(0xf0f4ff, 1.8)
    rim.position.set(-2, 1, -3)
    scene.add(rim)

    // Bottom light (blue glow)
    const bottom = new THREE.DirectionalLight(0x0ea5e9, 0.8)
    bottom.position.set(0, -4, 0)
    scene.add(bottom)

    // Back light for depth
    const back = new THREE.DirectionalLight(0xffffff, 1.0)
    back.position.set(0, 2, -4)
    scene.add(back)

    // === Tech Rings (Futuristic Style) ===
    
    // Ring 1 - Inner cyan
    const ring1Geo = new THREE.TorusGeometry(1.1, 0.015, 32, 128)
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8,
    })
    holoRing1 = new THREE.Mesh(ring1Geo, ring1Mat)
    holoRing1.position.set(0, 0.3, 0)
    holoRing1.rotation.x = Math.PI / 2
    scene.add(holoRing1)

    // Ring 2 - Middle silver
    const ring2Geo = new THREE.TorusGeometry(1.3, 0.012, 24, 100)
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xf0f4ff,
      emissive: 0x3b82f6,
      emissiveIntensity: 1.5,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.6,
    })
    holoRing2 = new THREE.Mesh(ring2Geo, ring2Mat)
    holoRing2.position.set(0, 0.3, 0)
    holoRing2.rotation.x = Math.PI / 3
    holoRing2.rotation.z = Math.PI / 6
    scene.add(holoRing2)

    // Ring 3 - Outer bright blue
    const ring3Geo = new THREE.TorusGeometry(1.5, 0.01, 24, 100)
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.5,
    })
    holoRing3 = new THREE.Mesh(ring3Geo, ring3Mat)
    holoRing3.position.set(0, 0.3, 0)
    holoRing3.rotation.x = Math.PI / 4
    holoRing3.rotation.z = -Math.PI / 6
    scene.add(holoRing3)

    // === Floating Particles (Data Stream) ===
    const particleCount = 500
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 2 + Math.random() * 3
      const height = (Math.random() - 0.5) * 6
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      sizes[i] = Math.random() * 0.05 + 0.02
    }
    
    const particlesGeo = new THREE.BufferGeometry()
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const particlesMat = new THREE.PointsMaterial({
      color: 0x0ea5e9,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    
    particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)

    isReady.value = true
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    const elapsed = clock.getElapsedTime()
    const dt = clock.getDelta()
    const scene = sceneRef.value
    if (!scene) return

    // Call custom animation callbacks
    animationCallbacks.forEach(callback => callback(dt, elapsed))

    // Enhanced ring animations with more dynamic effects
    if (holoRing1) {
      holoRing1.rotation.y = elapsed * 0.8
      holoRing1.rotation.z = Math.sin(elapsed * 0.5) * 0.1
      holoRing1.rotation.x = Math.cos(elapsed * 0.3) * 0.05
      
      // Stronger pulsing glow
      const pulse1 = Math.sin(elapsed * 2.5) * 0.6
      const flash1 = Math.sin(elapsed * 8) > 0.9 ? 0.3 : 0  // Occasional bright flash
      ;(holoRing1.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + pulse1 + flash1
      
      // Subtle scale breathing
      const scale1 = 1 + Math.sin(elapsed * 1.2) * 0.02
      holoRing1.scale.set(scale1, scale1, scale1)
    }
    
    if (holoRing2) {
      holoRing2.rotation.y = -elapsed * 0.6
      holoRing2.rotation.x = Math.PI / 3 + Math.sin(elapsed * 0.4) * 0.15
      holoRing2.rotation.z = Math.cos(elapsed * 0.7) * 0.08
      
      // Different pulse pattern
      const pulse2 = Math.cos(elapsed * 2) * 0.5
      ;(holoRing2.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + pulse2
      
      // Scale breathing out of phase
      const scale2 = 1 + Math.cos(elapsed * 1.5) * 0.025
      holoRing2.scale.set(scale2, scale2, scale2)
    }
    
    if (holoRing3) {
      holoRing3.rotation.y = elapsed * 0.4
      holoRing3.rotation.x = Math.PI / 4 + Math.cos(elapsed * 0.6) * 0.1
      holoRing3.rotation.z = Math.sin(elapsed * 0.9) * 0.06
      
      // Third unique pulse
      const pulse3 = Math.sin(elapsed * 2.8) * 0.55
      ;(holoRing3.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4 + pulse3
      
      // Scale breathing
      const scale3 = 1 + Math.sin(elapsed * 1.8) * 0.022
      holoRing3.scale.set(scale3, scale3, scale3)
    }

    // Enhanced particle animation (data stream effect)
    if (particles) {
      particles.rotation.y = elapsed * 0.25
      particles.rotation.x = Math.sin(elapsed * 0.3) * 0.1
      
      const positions = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        // Faster upward flow with wave motion
        positions[i + 1] += 0.018
        positions[i] += Math.sin(elapsed + positions[i + 1]) * 0.002
        
        if (positions[i + 1] > 4) {
          positions[i + 1] = -4
          positions[i] = (Math.random() - 0.5) * 6
        }
      }
      particles.geometry.attributes.position.needsUpdate = true
      
      // Subtle opacity pulsing
      ;(particles.material as THREE.PointsMaterial).opacity = 0.7 + Math.sin(elapsed * 1.5) * 0.15
    }

    renderer.render(scene, camera)
  }

  function registerAnimationCallbacks(callbacks: Array<(dt: number, elapsed: number) => void>) {
    animationCallbacks.push(...callbacks)
  }

  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !canvas.parentElement) return
    
    const width = canvas.parentElement.clientWidth
    const height = canvas.parentElement.clientHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function dispose() {
    cancelAnimationFrame(animFrameId)
    renderer.dispose()
  }

  onMounted(() => {
    init()
    if (isReady.value) {
      animate()
      window.addEventListener('resize', resize)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    dispose()
  })

  return { isReady, scene: sceneRef, animate: registerAnimationCallbacks }
}
