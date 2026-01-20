/**
 * analyzeGLB.mjs
 *
 * Utility script to analyze GLB files from Meshy AI.
 * Run with: node scripts/analyzeGLB.mjs <path-to-glb>
 *
 * Reports:
 * - Model dimensions and bounding box
 * - Mesh count and polygon count
 * - Materials and textures
 * - Animations (names, durations)
 * - Suggested scale and position
 */

import { readFileSync } from 'fs';
import { join, basename } from 'path';

// Simple GLB parser to extract basic info
function parseGLB(buffer) {
  const view = new DataView(buffer.buffer);

  // GLB Header
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546C67) { // 'glTF'
    throw new Error('Not a valid GLB file');
  }

  const version = view.getUint32(4, true);
  const length = view.getUint32(8, true);

  // First chunk (JSON)
  const chunk0Length = view.getUint32(12, true);
  const chunk0Type = view.getUint32(16, true);

  if (chunk0Type !== 0x4E4F534A) { // 'JSON'
    throw new Error('First chunk is not JSON');
  }

  const jsonData = buffer.slice(20, 20 + chunk0Length).toString('utf8');
  const gltf = JSON.parse(jsonData);

  return {
    version,
    totalSize: length,
    gltf
  };
}

function analyzeModel(filePath) {
  console.log('\n' + '='.repeat(60));
  console.log(`Analyzing: ${basename(filePath)}`);
  console.log('='.repeat(60) + '\n');

  const buffer = readFileSync(filePath);
  const { version, totalSize, gltf } = parseGLB(buffer);

  // Basic info
  console.log('📊 BASIC INFO');
  console.log(`   Version: glTF ${version}.0`);
  console.log(`   File size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   Generator: ${gltf.asset?.generator || 'Unknown'}`);
  console.log();

  // Scenes
  console.log('🎬 SCENES');
  console.log(`   Scene count: ${gltf.scenes?.length || 0}`);
  if (gltf.scene !== undefined) {
    console.log(`   Default scene: ${gltf.scene}`);
  }
  console.log();

  // Nodes (objects)
  console.log('📦 NODES (Objects)');
  console.log(`   Total nodes: ${gltf.nodes?.length || 0}`);
  if (gltf.nodes) {
    const namedNodes = gltf.nodes.filter(n => n.name);
    if (namedNodes.length > 0) {
      console.log('   Named nodes:');
      namedNodes.slice(0, 10).forEach(n => {
        console.log(`     - ${n.name}`);
      });
      if (namedNodes.length > 10) {
        console.log(`     ... and ${namedNodes.length - 10} more`);
      }
    }
  }
  console.log();

  // Meshes
  console.log('🔷 MESHES');
  console.log(`   Mesh count: ${gltf.meshes?.length || 0}`);
  if (gltf.meshes) {
    let totalPrimitives = 0;
    gltf.meshes.forEach(mesh => {
      totalPrimitives += mesh.primitives?.length || 0;
    });
    console.log(`   Total primitives: ${totalPrimitives}`);
  }
  console.log();

  // Materials
  console.log('🎨 MATERIALS');
  console.log(`   Material count: ${gltf.materials?.length || 0}`);
  if (gltf.materials) {
    gltf.materials.forEach((mat, i) => {
      const pbr = mat.pbrMetallicRoughness;
      console.log(`   [${i}] ${mat.name || 'Unnamed'}`);
      if (pbr?.baseColorFactor) {
        const [r, g, b] = pbr.baseColorFactor.map(v => Math.round(v * 255));
        console.log(`       Base color: rgb(${r}, ${g}, ${b})`);
      }
      if (pbr?.baseColorTexture !== undefined) {
        console.log(`       Has texture: Yes`);
      }
    });
  }
  console.log();

  // Textures
  console.log('🖼️  TEXTURES');
  console.log(`   Texture count: ${gltf.textures?.length || 0}`);
  console.log(`   Image count: ${gltf.images?.length || 0}`);
  if (gltf.images) {
    gltf.images.forEach((img, i) => {
      console.log(`   [${i}] ${img.name || img.uri || 'Embedded'} (${img.mimeType || 'unknown type'})`);
    });
  }
  console.log();

  // ANIMATIONS - Important for the Pepe character!
  console.log('🎭 ANIMATIONS');
  if (gltf.animations && gltf.animations.length > 0) {
    console.log(`   Animation count: ${gltf.animations.length}`);
    console.log('   Animation clips:');
    gltf.animations.forEach((anim, i) => {
      // Calculate duration from samplers
      let maxTime = 0;
      if (anim.samplers && gltf.accessors) {
        anim.samplers.forEach(sampler => {
          const accessor = gltf.accessors[sampler.input];
          if (accessor?.max) {
            maxTime = Math.max(maxTime, accessor.max[0]);
          }
        });
      }
      console.log(`   [${i}] "${anim.name || 'Unnamed'}" - ${maxTime.toFixed(2)}s - ${anim.channels?.length || 0} channels`);
    });
  } else {
    console.log('   No animations found');
  }
  console.log();

  // Skins (for skeletal animation)
  console.log('🦴 SKINNING');
  if (gltf.skins && gltf.skins.length > 0) {
    console.log(`   Skin count: ${gltf.skins.length}`);
    gltf.skins.forEach((skin, i) => {
      console.log(`   [${i}] ${skin.name || 'Unnamed'} - ${skin.joints?.length || 0} joints`);
    });
  } else {
    console.log('   No skins (not rigged for skeletal animation)');
  }
  console.log();

  // Summary and recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('-'.repeat(40));

  const hasAnimations = gltf.animations && gltf.animations.length > 0;
  const hasSkin = gltf.skins && gltf.skins.length > 0;

  if (hasAnimations) {
    console.log('✓ This model has animations!');
    console.log('  Use: useAnimations hook from @react-three/drei');
    console.log('  Example:');
    console.log('    const { actions } = useAnimations(animations, group);');
    console.log('    actions["AnimationName"].play();');
  } else {
    console.log('✗ No animations - this is a static model');
  }

  if (hasSkin) {
    console.log('✓ This model is rigged with a skeleton');
    console.log('  Can be animated programmatically or with clips');
  }

  // Size estimate
  const sizeKB = totalSize / 1024;
  if (sizeKB < 500) {
    console.log(`✓ File size is good (${sizeKB.toFixed(0)} KB)`);
  } else if (sizeKB < 2000) {
    console.log(`⚠ File size is moderate (${sizeKB.toFixed(0)} KB) - acceptable`);
  } else {
    console.log(`⚠ File size is large (${(sizeKB/1024).toFixed(1)} MB) - consider optimizing`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return {
    hasAnimations,
    hasSkin,
    animationNames: gltf.animations?.map(a => a.name) || [],
    meshCount: gltf.meshes?.length || 0,
    materialCount: gltf.materials?.length || 0,
  };
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  // Analyze all GLB files in models directory
  const modelsDir = join(process.cwd(), 'public', 'models', 'props');
  console.log(`\nScanning ${modelsDir} for GLB files...\n`);

  import('fs').then(fs => {
    try {
      const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));
      if (files.length === 0) {
        console.log('No GLB files found in', modelsDir);
        console.log('\nUsage: node scripts/analyzeGLB.mjs [path-to-glb]');
        console.log('Or place GLB files in public/models/props/ and run without arguments');
      } else {
        files.forEach(file => {
          analyzeModel(join(modelsDir, file));
        });
      }
    } catch (err) {
      console.log('Directory not found:', modelsDir);
      console.log('\nUsage: node scripts/analyzeGLB.mjs <path-to-glb>');
    }
  });
} else {
  // Analyze specific file
  analyzeModel(args[0]);
}
