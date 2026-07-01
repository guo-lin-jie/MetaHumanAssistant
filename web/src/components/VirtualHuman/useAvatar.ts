import * as THREE from 'three'
import { ref, Ref } from 'vue'

export interface Avatar {
  build: () => void
  breathe: (elapsed: number) => void
  animateMouth: (level: number) => void
  lookAtMouse: (mouseX: number, mouseY: number) => void
  dispose: () => void
  group: THREE.Group
}

export function useAvatar(scene: THREE.Scene): Avatar {
  const group = new THREE.Group()
  scene.add(group)

  let mouthMesh: Ref<THREE.Mesh | null> = ref(null)
  let leftEye: Ref<THREE.Mesh | null> = ref(null)
  let rightEye: Ref<THREE.Mesh | null> = ref(null)
  let leftPupil: THREE.Mesh
  let rightPupil: THREE.Mesh
  let coreLight: THREE.PointLight
  
  // Blink animation state
  let lastBlinkTime = 0
  let isBlinking = false
  let blinkDuration = 0.15

  function build() {
    // === Futuristic Materials ===
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xf0f4ff, 
      roughness: 0.15, 
      metalness: 0.85,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.08
    })
    
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.1,
      metalness: 0.95,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.6,
    })
    
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.95,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    })
    
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.05,
      metalness: 1.0,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.2,
    })

    // === Main Body - Sleek Capsule Shape ===
    const bodyGeo = new THREE.CapsuleGeometry(0.7, 1.2, 32, 64)
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.3
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Core light inside
    coreLight = new THREE.PointLight(0x0ea5e9, 1.5, 8)
    coreLight.position.set(0, 0.3, 0)
    group.add(coreLight)

    // === Face Screen ===
    const faceGeo = new THREE.SphereGeometry(0.65, 64, 64)
    const face = new THREE.Mesh(faceGeo, glassMat)
    face.position.set(0, 0.5, 0.45)
    face.scale.set(1, 0.85, 0.5)
    group.add(face)

    // === Eyes - Holographic Display ===
    const eyeContainerGeo = new THREE.SphereGeometry(0.15, 32, 32)
    const eyeContainerMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.3,
    })
    
    const lEyeContainer = new THREE.Mesh(eyeContainerGeo, eyeContainerMat)
    lEyeContainer.position.set(-0.28, 0.55, 0.68)
    group.add(lEyeContainer)
    leftEye.value = lEyeContainer

    const rEyeContainer = new THREE.Mesh(eyeContainerGeo, eyeContainerMat)
    rEyeContainer.position.set(0.28, 0.55, 0.68)
    group.add(rEyeContainer)
    rightEye.value = rEyeContainer

    // Pupils - Glowing Core
    const pupilGeo = new THREE.SphereGeometry(0.08, 16, 16)
    leftPupil = new THREE.Mesh(pupilGeo, coreMat)
    leftPupil.position.set(-0.28, 0.53, 0.78)
    group.add(leftPupil)

    rightPupil = new THREE.Mesh(pupilGeo, coreMat)
    rightPupil.position.set(0.28, 0.53, 0.78)
    group.add(rightPupil)

    // === Mouth - Digital Line ===
    const mouthGeo = new THREE.BoxGeometry(0.3, 0.02, 0.02)
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
    })
    const mouth = new THREE.Mesh(mouthGeo, mouthMat)
    mouth.position.set(0, 0.35, 0.68)
    group.add(mouth)
    mouthMesh.value = mouth

    // === Tech Rings Around Head ===
    const ringGroup = new THREE.Group()
    
    // Inner ring
    const innerRingGeo = new THREE.TorusGeometry(0.75, 0.015, 16, 64)
    const innerRing = new THREE.Mesh(innerRingGeo, accentMat)
    innerRing.rotation.x = Math.PI / 2
    ringGroup.add(innerRing)
    
    // Middle ring (tilted)
    const midRingGeo = new THREE.TorusGeometry(0.85, 0.012, 16, 64)
    const midRing = new THREE.Mesh(midRingGeo, accentMat)
    midRing.rotation.x = Math.PI / 3
    midRing.rotation.z = Math.PI / 6
    ringGroup.add(midRing)
    
    // Outer ring (opposite tilt)
    const outerRingGeo = new THREE.TorusGeometry(0.95, 0.01, 16, 64)
    const outerRing = new THREE.Mesh(outerRingGeo, accentMat)
    outerRing.rotation.x = Math.PI / 4
    outerRing.rotation.z = -Math.PI / 6
    ringGroup.add(outerRing)
    
    ringGroup.position.y = 0.5
    group.add(ringGroup)

    // === Side Panels ===
    const panelGeo = new THREE.BoxGeometry(0.15, 0.6, 0.05)
    const lPanel = new THREE.Mesh(panelGeo, accentMat)
    lPanel.position.set(-0.78, 0.5, 0)
    lPanel.rotation.y = Math.PI / 2
    group.add(lPanel)
    
    const rPanel = new THREE.Mesh(panelGeo, accentMat)
    rPanel.position.set(0.78, 0.5, 0)
    rPanel.rotation.y = Math.PI / 2
    group.add(rPanel)

    // === Neck - Slim Connector ===
    const neckGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 32)
    const neck = new THREE.Mesh(neckGeo, bodyMat)
    neck.position.set(0, -0.5, 0)
    group.add(neck)

    // === Base Platform ===
    const baseGroup = new THREE.Group()
    
    // Main platform
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.2, 64)
    const base = new THREE.Mesh(baseGeo, bodyMat)
    base.position.y = -0.8
    base.castShadow = true
    baseGroup.add(base)
    
    // Glowing ring on base
    const baseRingGeo = new THREE.TorusGeometry(0.85, 0.02, 16, 64)
    const baseRing = new THREE.Mesh(baseRingGeo, accentMat)
    baseRing.position.y = -0.8
    baseRing.rotation.x = Math.PI / 2
    baseGroup.add(baseRing)
    
    // Energy core at bottom
    const coreGeo = new THREE.SphereGeometry(0.3, 32, 32)
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.position.y = -0.9
    baseGroup.add(core)
    
    group.add(baseGroup)

    // === Floating Data Particles ===
    const particleCount = 150
    const particlesGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 1.2 + Math.random() * 0.5
      const height = (Math.random() - 0.5) * 2
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const particlesMat = new THREE.PointsMaterial({
      color: 0x0ea5e9,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
    
    const particles = new THREE.Points(particlesGeo, particlesMat)
    particles.userData = { isParticles: true }
    group.add(particles)

    scene.add(group)
  }

  // Breathing animation with head movement
  function breathe(elapsed: number) {
    const breath = Math.sin(elapsed * 1.5) * 0.03 + 0.02
    group.position.y = breath
    
    // Subtle head nodding
    const nodAngle = Math.sin(elapsed * 0.8) * 0.02
    group.rotation.x = nodAngle
    
    // Gentle side-to-side sway
    const swayAngle = Math.sin(elapsed * 0.6) * 0.015
    group.rotation.z = swayAngle

    // Core light pulsing
    if (coreLight) {
      coreLight.intensity = 1.5 + Math.sin(elapsed * 2) * 0.3
    }

    // Animate particles (data stream)
    const particles = group.children.find(c => c.userData?.isParticles) as THREE.Points | undefined
    if (particles) {
      particles.rotation.y = elapsed * 0.3
      particles.position.y = Math.sin(elapsed * 0.8) * 0.15
      
      // Faster particle flow
      const positions = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.015
        if (positions[i + 1] > 4) {
          positions[i + 1] = -4
        }
      }
      particles.geometry.attributes.position.needsUpdate = true
    }
    
    // Blink animation
    handleBlink(elapsed)
  }
  
  // Handle eye blinking
  function handleBlink(elapsed: number) {
    const timeSinceLastBlink = elapsed - lastBlinkTime
    
    // Random blink every 2-5 seconds
    if (!isBlinking && timeSinceLastBlink > 2 + Math.random() * 3) {
      isBlinking = true
      lastBlinkTime = elapsed
    }
    
    if (isBlinking) {
      const blinkProgress = (elapsed - lastBlinkTime) / blinkDuration
      
      if (blinkProgress < 0.5) {
        // Closing eyes
        const scale = 1 - blinkProgress * 2
        updateEyeScale(scale)
      } else if (blinkProgress < 1) {
        // Opening eyes
        const scale = (blinkProgress - 0.5) * 2
        updateEyeScale(scale)
      } else {
        // Blink complete
        isBlinking = false
        updateEyeScale(1)
      }
    }
  }
  
  // Update eye container scale for blinking
  function updateEyeScale(scale: number) {
    if (leftEye.value) {
      leftEye.value.scale.set(1, scale, 1)
    }
    if (rightEye.value) {
      rightEye.value.scale.set(1, scale, 1)
    }
  }

  // Speaking animation - mouth expands with more dynamic effects
  function animateMouth(level: number) {
    if (!mouthMesh.value) return
    
    // Base expansion from audio level
    const scaleY = 0.02 + level * 0.18
    const scaleX = 0.3 + level * 0.25
    
    // Add subtle wave effect to mouth width
    const waveEffect = Math.sin(Date.now() * 0.01) * 0.02 * level
    const finalScaleX = scaleX + waveEffect
    
    mouthMesh.value.scale.set(finalScaleX, scaleY, 1)
    
    // Dynamic glow intensity
    const baseGlow = 0.5 + level * 0.5
    const pulseGlow = Math.sin(Date.now() * 0.008) * 0.2 * level
    ;(mouthMesh.value.material as THREE.MeshStandardMaterial).emissiveIntensity = baseGlow + pulseGlow
    
    // Slight position shift when speaking loudly
    const speakOffset = level * 0.02
    mouthMesh.value.position.y = 0.35 + speakOffset
  }

  // Eye tracking with smooth movement and subtle idle animation
  function lookAtMouse(mouseX: number, mouseY: number) {
    const clampX = Math.max(-1, Math.min(1, mouseX))
    const clampY = Math.max(-1, Math.min(1, mouseY))
    
    // Add subtle idle movement when not actively tracking
    const idleOffsetX = Math.sin(Date.now() * 0.001) * 0.005
    const idleOffsetY = Math.cos(Date.now() * 0.0012) * 0.003
    
    const offsetX = clampX * 0.04 + idleOffsetX
    const offsetY = clampY * 0.03 + idleOffsetY
    
    if (leftEye.value) {
      leftEye.value.position.x = -0.28 + offsetX
      leftEye.value.position.y = 0.55 + offsetY
      leftPupil.position.x = -0.28 + offsetX * 1.3
      leftPupil.position.y = 0.53 + offsetY * 1.3
    }
    
    if (rightEye.value) {
      rightEye.value.position.x = 0.28 + offsetX
      rightEye.value.position.y = 0.55 + offsetY
      rightPupil.position.x = 0.28 + offsetX * 1.3
      rightPupil.position.y = 0.53 + offsetY * 1.3
    }
  }

  function dispose() {
    group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
    scene.remove(group)
  }

  return { build, breathe, animateMouth, lookAtMouse, dispose, group }
}
