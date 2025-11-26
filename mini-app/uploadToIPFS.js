import { PinataSDK } from "pinata";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

/**
 * Upload pepeArtGen generated cards to IPFS
 * 
 * This script:
 * 1. Uploads all generated images to IPFS
 * 2. Updates metadata files with IPFS image URIs
 * 3. Uploads metadata folder to IPFS
 * 4. Provides contract baseURI for deployment
 */
async function uploadCollection() {
  console.log("🎴 PepeArtGen IPFS Upload Tool\n");
  console.log("=" .repeat(50));

  // Verify Pinata JWT exists
  if (!process.env.PINATA_JWT) {
    console.error("❌ Error: PINATA_JWT not found in .env file");
    console.log("\nSet up Pinata:");
    console.log("1. Sign up at https://pinata.cloud/");
    console.log("2. Create API key with pinFileToIPFS permission");
    console.log("3. Add PINATA_JWT=your_jwt_token to .env file");
    process.exit(1);
  }

  // Check if generated-cards folder exists
  const generatedCardsPath = path.join(__dirname, "../pepeArtGen/generated-cards");
  if (!fs.existsSync(generatedCardsPath)) {
    console.error("❌ Error: generated-cards folder not found");
    console.log("\nRun pepeArtGen pipeline first:");
    console.log("cd ../pepeArtGen");
    console.log("node completeCardPipeline.mjs");
    process.exit(1);
  }

  const imagesFolder = path.join(generatedCardsPath, "generated-images");
  const metadataFolder = path.join(generatedCardsPath, "metadata");

  // Check folders exist
  if (!fs.existsSync(imagesFolder)) {
    console.error("❌ Error: generated-images folder not found");
    process.exit(1);
  }

  if (!fs.existsSync(metadataFolder)) {
    console.error("❌ Error: metadata folder not found");
    process.exit(1);
  }

  try {
    // Step 1: Upload Images
    console.log("\n📤 Step 1: Uploading images to IPFS...");
    const imageFiles = fs.readdirSync(imagesFolder);
    console.log(`   Found ${imageFiles.length} images`);

    const imageUpload = await pinata.upload.folder(imagesFolder, {
      name: "SURF-Waves-Images",
      metadata: {
        keyvalues: {
          collection: "SURF Waves Cards",
          type: "images",
          timestamp: new Date().toISOString(),
        },
      },
    });

    const imageCID = imageUpload.IpfsHash;
    console.log(`   ✅ Images uploaded: ipfs://${imageCID}/`);
    console.log(`   🌐 View at: https://gateway.pinata.cloud/ipfs/${imageCID}/`);

    // Step 2: Update Metadata with Image CIDs
    console.log("\n📝 Step 2: Updating metadata with IPFS URIs...");
    const metadataFiles = fs.readdirSync(metadataFolder).filter((f) =>
      f.endsWith(".json")
    );
    console.log(`   Found ${metadataFiles.length} metadata files`);

    let updatedCount = 0;
    for (const file of metadataFiles) {
      const filePath = path.join(metadataFolder, file);
      const metadata = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Extract original image filename
      const imageName = path.basename(metadata.image);

      // Update image URL to IPFS
      metadata.image = `ipfs://${imageCID}/${imageName}`;

      // Also update animation_url if present
      if (metadata.animation_url) {
        const animationName = path.basename(metadata.animation_url);
        metadata.animation_url = `ipfs://${imageCID}/${animationName}`;
      }

      // Write updated metadata
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
      updatedCount++;
    }
    console.log(`   ✅ Updated ${updatedCount} metadata files`);

    // Step 3: Upload Metadata
    console.log("\n📤 Step 3: Uploading metadata to IPFS...");
    const metadataUpload = await pinata.upload.folder(metadataFolder, {
      name: "SURF-Waves-Metadata",
      metadata: {
        keyvalues: {
          collection: "SURF Waves Cards",
          type: "metadata",
          imageCID: imageCID,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const metadataCID = metadataUpload.IpfsHash;
    console.log(`   ✅ Metadata uploaded: ipfs://${metadataCID}/`);
    console.log(
      `   🌐 View at: https://gateway.pinata.cloud/ipfs/${metadataCID}/`
    );

    // Step 4: Provide Instructions
    console.log("\n" + "=".repeat(50));
    console.log("✅ Upload Complete!\n");
    console.log("📋 Contract Configuration:");
    console.log("-".repeat(50));
    console.log(`Base URI: ipfs://${metadataCID}/`);
    console.log(`\nImage CID: ${imageCID}`);
    console.log(`Metadata CID: ${metadataCID}`);
    console.log("-".repeat(50));

    console.log("\n🚀 Next Steps:");
    console.log("\n1. Update Deploy.s.sol with metadata CID:");
    console.log(`   string memory baseURI = "ipfs://${metadataCID}/";`);

    console.log("\n2. Deploy contract:");
    console.log("   forge script script/Deploy.s.sol:DeployPepeArtGen \\");
    console.log("     --rpc-url base_sepolia \\");
    console.log("     --broadcast \\");
    console.log("     --verify");

    console.log("\n3. Or update existing contract:");
    console.log("   cast send <CONTRACT_ADDRESS> \\");
    console.log(`     'setBaseURI(string)' "ipfs://${metadataCID}/" \\`);
    console.log("     --rpc-url base_sepolia \\");
    console.log("     --private-key $PRIVATE_KEY");

    console.log("\n4. Test mint:");
    console.log("   Token 1 metadata: " + 
      `https://gateway.pinata.cloud/ipfs/${metadataCID}/1.json`);

    // Save CIDs to file for reference
    const cidInfo = {
      imageCID,
      metadataCID,
      baseURI: `ipfs://${metadataCID}/`,
      imageGateway: `https://gateway.pinata.cloud/ipfs/${imageCID}/`,
      metadataGateway: `https://gateway.pinata.cloud/ipfs/${metadataCID}/`,
      uploadDate: new Date().toISOString(),
      imageCount: imageFiles.length,
      metadataCount: metadataFiles.length,
    };

    const cidFilePath = path.join(__dirname, "ipfs-cids.json");
    fs.writeFileSync(cidFilePath, JSON.stringify(cidInfo, null, 2));
    console.log(`\n💾 CID info saved to: ${cidFilePath}`);

    console.log("\n" + "=".repeat(50));
  } catch (error) {
    console.error("\n❌ Upload failed:", error.message);
    
    if (error.message.includes("401")) {
      console.log("\n🔑 Authentication error. Check:");
      console.log("1. PINATA_JWT is correct in .env");
      console.log("2. JWT token has pinFileToIPFS permission");
      console.log("3. Token hasn't expired");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n💰 Pinata account issue:");
      console.log("1. Check your Pinata plan limits");
      console.log("2. Upgrade plan if needed: https://pinata.cloud/pricing");
    }
    
    process.exit(1);
  }
}

// Run upload
uploadCollection();
