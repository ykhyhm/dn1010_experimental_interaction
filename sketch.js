// Global variables for humans and icons
let icons = [];
let human;
let totalCaffeine = 0;
let caffeineLimit = 400;
let isFlashing = false;

// Global variables for video capture, Handpose model, predictions, and pinch state.
let video;
let handpose;
let predictions = [];

// Boolean flag to track if a pinch gesture is active.
let pinchActive = false;

// Threshold (in pixels) for detecting a pinch gesture.
const BASE_PINCH_THRESHOLD = 40;

// Global variables for storing text position and pinch distance.
let pinchDistance = undefined;
let textPosX = 0;
let textPosY = 0;

// Scaling factor for pinch threshold (adjust as needed)
let pinchScaleFactor = 1;

// Global variables for cooldown
let lastPinchTime = 0;
const PINCH_COOLDOWN = 1000;

// Image variables for caffeine icons
let coffeeImg;
let darkChocolateImg;
let greenTeaImg;
let energyDrinkImg;
let bubbleTeaImg;
let cokeImg;

// Human face images
let humanImages = [];

function preload() {
  coffeeImg = loadImage("assets/coffee.png");
  darkChocolateImg = loadImage("assets/dark_chocolate.png");
  greenTeaImg = loadImage("assets/green_tea.png");
  energyDrinkImg = loadImage("assets/energy_drink.png");
  bubbleTeaImg = loadImage("assets/bubble_tea.png");
  cokeImg = loadImage("assets/coke.png");

  // Load human face images
  humanImages[0] = loadImage("assets/face0.png"); // 0%
  humanImages[10] = loadImage("assets/face10.png"); // 10%
  humanImages[20] = loadImage("assets/face20.png"); // 20%
  humanImages[30] = loadImage("assets/face30.png"); // 30%
  humanImages[40] = loadImage("assets/face40.png"); // 40%
  humanImages[50] = loadImage("assets/face50.png"); // 50%
  humanImages[60] = loadImage("assets/face60.png"); // 60%
  humanImages[70] = loadImage("assets/face70.png"); // 70%
  humanImages[80] = loadImage("assets/face80.png"); // 80%
  humanImages[90] = loadImage("assets/face90.png"); // 90%
  humanImages[100] = loadImage("assets/face100.png"); // 100%
  humanImages[110] = loadImage("assets/face110.png"); // 110%
  humanImages[120] = loadImage("assets/face120.png"); // 120%
  humanImages[130] = loadImage("assets/face130.png"); // 130%
  humanImages[140] = loadImage("assets/face140.png"); // 140%
  humanImages[150] = loadImage("assets/face150.png"); // 150%
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);

  // Update pinch scale factor based on window size (example)
  pinchScaleFactor = min(windowWidth / 640, windowHeight / 480); // Adjust base dimensions as needed
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Update pinch scale factor based on window size (example)
  pinchScaleFactor = min(windowWidth / 640, windowHeight / 480); // Adjust base dimensions as needed

  ///// human and icons setup /////
  human = new Human(width / 2, height / 2); // Place the human in the center

  // Define the x position for the icons (1/4 of the screen width)
  let iconX1 = width / 4;
  let iconX2 = (width * 3) / 4;

  // Initial Y position
  let initialY = 30;
  // Spacing between icons
  let verticalSpacing = 140; // Adjust this value to change the spacing

  // Caffeine icons
  icons.push(new CaffeineIcon("Green Tea", 20, iconX1, initialY, greenTeaImg));
  icons.push(
    new CaffeineIcon("Energy Drink", 80, iconX2, initialY + initialY, energyDrinkImg)
  );
  icons.push(
    new CaffeineIcon("Bubble Tea", 60, iconX1, initialY + verticalSpacing * 2, bubbleTeaImg)
  );
  icons.push(
    new CaffeineIcon("Coke", 40, iconX2, initialY + verticalSpacing * 2, cokeImg)
  );
  icons.push(
    new CaffeineIcon("Coffee", 95, iconX1, initialY + verticalSpacing * 4, coffeeImg)
  );
  icons.push(
    new CaffeineIcon(
      "Dark Chocolate Bar",
      23,
      iconX2,
      initialY + verticalSpacing * 4,
      darkChocolateImg
    )
  );

  ///// VIDEO SETUP /////
  // Start capturing video.
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  // Load the Handpose model.
  handpose = ml5.handpose(video, modelReady);

  // Listen for prediction events.
  handpose.on("predict", (results) => {
    predictions = results;
  });
}

function modelReady() {
  console.log("Handpose model loaded!");
}

function draw() {
  // Calculate scaled pinch threshold
  let scaledPinchThreshold = BASE_PINCH_THRESHOLD * pinchScaleFactor;

  // Draw everything in a mirrored coordinate system.
  push();
  // Mirror horizontally.
  translate(width, 0);
  scale(-1, 1);

  // Draw the video feed (mirrored).
  image(video, 0, 0, width, height);

  // Draw the human body
  human.update();
  human.display();

  // Compute scaling factors from the raw video dimensions to the canvas dimensions.
  let sx = width / video.elt.videoWidth;
  let sy = height / video.elt.videoHeight;

  // If a hand is detected, process the landmarks.
  if (predictions.length > 0) {
    let landmarks = predictions[0].landmarks;

    // Get the thumb tip (landmark 4) and index finger tip (landmark 8).
    let thumbTip = landmarks[4];
    let indexTip = landmarks[8];

    // Scale the raw landmark coordinates to the canvas.
    let tX = thumbTip[0] * sx;
    let tY = thumbTip[1] * sy;
    let iX = indexTip[0] * sx;
    let iY = indexTip[1] * sy;

    // Draw simple green ellipses for each fingertip.
    noStroke();
    fill(0, 255, 0);
    ellipse(tX, tY, 10, 10); // Thumb indicator
    ellipse(iX, iY, 10, 10); // Index finger indicator

    // Compute the pinch distance between the two fingertips.
    pinchDistance = dist(tX, tY, iX, iY);

    // Compute the midpoint of the two fingertip positions (in mirrored space).
    let midX_mirrored = (tX + iX) / 2;
    let midY = (tY + iY) / 2 - 10; // Slight upward offset

    // Convert the mirrored x-coordinate to normal (non‑mirrored) coordinates.
    textPosX = width - midX_mirrored;
    textPosY = midY;

    // Check if a pinch gesture is detected
    if (pinchDistance < scaledPinchThreshold) {
      // Check if enough time has passed since the last pinch
      if (millis() - lastPinchTime > PINCH_COOLDOWN) {
        checkIconInteraction(textPosX, textPosY);

        // Update the last pinch time
        lastPinchTime = millis();
      }
    }
  }
  pop();

  // Draw and check for icon interactions
  for (let icon of icons) {
    // icon.update();
    icon.display();
  }

  // Check if total caffeine exceeds the limit
  if (totalCaffeine >= caffeineLimit) {
    console.log("Caffeine limit exceeded!");
    isFlashing = true;
    human.fallDown();
  }

  // Flash screen if caffeine is too high
  if (isFlashing) {
    flashScreen();
  }
}

class Human {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.caffeineLevel = 0; // Caffeine percentage (0-150)
    this.imageWidth = 300; // Desired width of the image
    this.imageHeight = 400; // Desired height of the image
  }

  update() {
    // Add additional animation or behavior for human body here
  }

  display() {
    push(); // Save the current drawing state
    // Flip horizontally by scaling by -1 and translating
    translate(this.x, this.y);
    scale(-1, 1);

    // Determine which image to display based on caffeineLevel
    let imgIndex;
    if (this.caffeineLevel <= 0) {
      imgIndex = 0;
    } else if (this.caffeineLevel >= 150) {
      imgIndex = 150;
    } else {
      imgIndex = Math.floor(this.caffeineLevel / 10) * 10; // Ro
    }

    let currentImage = humanImages[imgIndex];
    let aspectRatio = currentImage.width / currentImage.height;
    let scaledWidth = this.imageHeight * aspectRatio;

    // Display the corresponding human image
    image(
      humanImages[imgIndex],
      -scaledWidth / 2,
      -this.imageHeight / 2,
      scaledWidth,
      this.imageHeight
    ); // Adjust position and size as needed

    pop(); // Restore the previous drawing state
  }

  changeExpression(totalCaffeine) {
    // Calculate caffeine percentage
    this.caffeineLevel = map(totalCaffeine, 0, caffeineLimit, 0, 150);
    this.caffeineLevel = constrain(this.caffeineLevel, 0, 150); // Keep within 0-150

    console.log("Caffeine Level: " + this.caffeineLevel);
  }

  fallDown() {
    // Animate the human falling down
    this.y += 10; // Fall down over time
  }
}

// Caffeine Icon
class CaffeineIcon {
  constructor(name, caffeineAmount, x, y, img) {
    this.name = name;
    this.caffeineAmount = caffeineAmount;
    this.x = x;
    this.y = y;
    this.img = img; // Store the image
    this.originalWidth = img.width; // Store original width
    this.originalHeight = img.height; // Store original height
    this.scaledWidth = 150; // Fixed width for the icon
    this.scaledHeight = (this.scaledWidth / this.originalWidth) * this.originalHeight;
  }

  display() {
    // Draw the image instead of the rectangle and text
    if (this.img) {
      image(this.img, this.x, this.y, this.scaledWidth, this.scaledHeight); // Draw the image with scaled dimensions
    } else {
      // Fallback in case the image is not loaded
      fill(200);
      stroke(0);
      rect(this.x, this.y, this.scaledWidth, this.scaledHeight);
      fill(0);
      text(this.name, this.x + 10, this.y + 25);
    }
  }
}

function flashScreen() {
  if (totalCaffeine >= caffeineLimit) {
    background(255, 0, 0); // Red flashing
  }
}

// Function to check if a pinch overlaps with any icon
function checkIconInteraction(pinchedX, pinchedY) {
  for (let icon of icons) {
    if (
      pinchedX > icon.x &&
      pinchedX < icon.x + icon.scaledWidth &&
      pinchedY > icon.y &&
      pinchedY < icon.y + icon.scaledHeight
    ) {
      totalCaffeine += icon.caffeineAmount; // Add caffeine amount from the icon
      totalCaffeine = constrain(totalCaffeine, 0, caffeineLimit); // Prevent exceeding limit
      human.changeExpression(totalCaffeine); // Update human expression
      console.log(`Pinched ${icon.name}, Total Caffeine: ${totalCaffeine}`);

      if (totalCaffeine >= caffeineLimit) {
        isFlashing = true;
      }
      break; // Exit loop after finding one match
    }
  }
}
