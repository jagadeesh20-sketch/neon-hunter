import Phaser from 'phaser';
import { QUESTS, TILE_SIZE } from '../constants';
import { gameEvents } from '../services/eventBus';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private questMarkers: Phaser.GameObjects.Group | null = null;
  private nearbyQuestId: string | null = null;
  private interactionText!: Phaser.GameObjects.Text;
  private buildings!: Phaser.Physics.Arcade.StaticGroup;

  // Joystick properties
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private isJoystickActive = false;
  private joystickPointerId: number | null = null; // Track specific pointer for multi-touch
  private joystickOrigin = { x: 0, y: 0 };
  private movementVector = { x: 0, y: 0 };

  // Explicitly declare scene properties to fix TypeScript errors
  public add!: Phaser.GameObjects.GameObjectFactory;
  public physics!: Phaser.Physics.Arcade.ArcadePhysics;
  public cameras!: Phaser.Cameras.Scene2D.CameraManager;
  public input!: Phaser.Input.InputPlugin;

  constructor() {
    super('GameScene');
  }

  preload() {
    // In a real app, load sprites here.
    // For this demo, we use Phaser primitives (rectangles).
  }

  create() {
    // 1. Create World (Simple City)
    this.createCityMap();

    // 2. Create Objects (Quests)
    this.questMarkers = this.add.group();
    QUESTS.forEach((quest) => {
      // Quest Object (Visual)
      const marker = this.add.rectangle(quest.location.x, quest.location.y, 32, 32, 0xffff00);
      this.physics.add.existing(marker, true); // Static body
      marker.setData('questId', quest.id);
      this.questMarkers?.add(marker);

      // Shadow/Base
      this.add.ellipse(quest.location.x, quest.location.y + 15, 32, 10, 0x000000, 0.3);
    });

    // 3. Create Player
    this.player = this.add.rectangle(400, 300, 24, 24, 0x00ffff);
    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    // 4. Camera Follow
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBounds(0, 0, 800, 600); // Small world for demo

    // 5. Input Setup
    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
        // Add WASD Keys
        this.wasd = this.input.keyboard.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D
        }) as any;
    }

    // 6. UI Indicator (Floating Text)
    // We make this interactive so mobile users can tap it
    this.interactionText = this.add.text(0, 0, 'Press E', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    });
    this.interactionText.setDepth(100);
    this.interactionText.setVisible(false);
    this.interactionText.setInteractive({ useHandCursor: true });
    
    // Handle tap on interaction text
    this.interactionText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Stop propagation so joystick doesn't trigger
      // (Note: Phaser event bubbling is different, but checking nearbyQuestId is safe)
      this.triggerInteraction();
    });

    // 7. Virtual Joystick Visuals
    this.joystickBase = this.add.circle(0, 0, 50, 0x888888, 0.5)
      .setScrollFactor(0) // Stick to screen
      .setDepth(999)
      .setVisible(false);
    
    this.joystickThumb = this.add.circle(0, 0, 25, 0xcccccc, 0.9)
      .setScrollFactor(0) // Stick to screen
      .setDepth(1000)
      .setVisible(false);

    // 8. Touch/Pointer Events for Joystick
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointerout', this.handlePointerUp, this); // Handle dragging off screen

    // 9. Physics Collisions/Overlaps
    if (this.buildings) {
      this.physics.add.collider(this.player, this.buildings);
    }

    // Interaction Overlap
    if (this.questMarkers) {
      this.physics.add.overlap(
        this.player,
        this.questMarkers,
        this.handleOverlap,
        undefined,
        this
      );
    }
  }

  update() {
    this.handleMovement();
    
    // Reset interaction state if not overlapping
    if (this.nearbyQuestId && !this.physics.overlap(this.player, this.questMarkers!)) {
      this.nearbyQuestId = null;
      this.interactionText.setVisible(false);
    }

    // Handle Keyboard Interaction
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.triggerInteraction();
    }
  }

  private triggerInteraction() {
    if (this.nearbyQuestId) {
      gameEvents.emit('openQuest', this.nearbyQuestId);
      // Stop player when dialog opens
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.handlePointerUp(); // Reset joystick
    }
  }

  private createCityMap() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x2d2d2d);
    
    // Grid lines for "Ground"
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x444444, 1);
    for (let x = 0; x <= 800; x += TILE_SIZE) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, 600);
    }
    for (let y = 0; y <= 600; y += TILE_SIZE) {
      graphics.moveTo(0, y);
      graphics.lineTo(800, y);
    }
    graphics.strokePath();

    // Random Buildings (Obstacles)
    this.buildings = this.physics.add.staticGroup();
    // Building 1
    this.buildings.add(this.add.rectangle(100, 100, 100, 100, 0x555555));
    // Building 2
    this.buildings.add(this.add.rectangle(600, 300, 150, 200, 0x555555));
  }

  private handleMovement() {
    const speed = 160;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Default velocity
    let velX = 0;
    let velY = 0;

    // 1. Keyboard Input (WASD or Arrows)
    // Only check keyboard if joystick is not active to prevent conflicts
    if (!this.isJoystickActive && this.input.keyboard) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        velX = -1;
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        velX = 1;
      }

      if (this.cursors.up.isDown || this.wasd.up.isDown) {
        velY = -1;
      } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
        velY = 1;
      }

      // Normalize diagonal speed for keyboard
      if (velX !== 0 || velY !== 0) {
        const mag = Math.sqrt(velX * velX + velY * velY);
        velX /= mag;
        velY /= mag;
      }
    }

    // 2. Joystick Input (Overrides Keyboard)
    if (this.isJoystickActive) {
      velX = this.movementVector.x;
      velY = this.movementVector.y;
    }

    // Apply velocity
    body.setVelocity(velX * speed, velY * speed);
  }

  // Joystick Event Handlers
  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Ignore if we are clicking on the interaction text or if a joystick is already active
    // We can check if the target object is the interaction text
    const objects = this.input.hitTestPointer(pointer);
    if (objects.includes(this.interactionText)) return;

    if (!this.isJoystickActive) {
      this.joystickPointerId = pointer.id;
      this.isJoystickActive = true;
      this.joystickOrigin = { x: pointer.x, y: pointer.y };

      // Show visuals at touch point
      this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
      this.joystickThumb.setPosition(pointer.x, pointer.y).setVisible(true);
      
      this.movementVector = { x: 0, y: 0 };
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isJoystickActive && pointer.id === this.joystickPointerId) {
      const maxDistance = 50; // Radius of base
      
      let dx = pointer.x - this.joystickOrigin.x;
      let dy = pointer.y - this.joystickOrigin.y;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Cap movement at maxDistance for the visual thumb
      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }
      
      this.joystickThumb.setPosition(this.joystickOrigin.x + dx, this.joystickOrigin.y + dy);

      // Calculate normalized vector for movement
      // We use a small deadzone of 5
      if (distance > 5) {
         // Normalize based on maxDistance for analog control (0.0 to 1.0 magnitude)
         // Or just normalize direction. Let's do simple normalized direction.
         const rawMag = Math.min(distance, maxDistance);
         // Scale input: allows walking slower if pushing stick slightly
         const scale = rawMag / maxDistance; 
         
         const angle = Math.atan2(dy, dx);
         this.movementVector = {
           x: Math.cos(angle) * scale,
           y: Math.sin(angle) * scale
         };
      } else {
        this.movementVector = { x: 0, y: 0 };
      }
    }
  }

  private handlePointerUp(pointer?: Phaser.Input.Pointer) {
    // specific pointer check if passed, otherwise reset all (fallback)
    if (pointer && this.joystickPointerId !== null && pointer.id !== this.joystickPointerId) {
      return;
    }

    this.isJoystickActive = false;
    this.joystickPointerId = null;
    this.movementVector = { x: 0, y: 0 };
    this.joystickBase.setVisible(false);
    this.joystickThumb.setVisible(false);
  }

  private handleOverlap = (
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    object: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) => {
    const marker = object as Phaser.GameObjects.Rectangle;
    const questId = marker.getData('questId');
    
    this.nearbyQuestId = questId;
    
    // Position text above the marker
    this.interactionText.setPosition(marker.x - 30, marker.y - 50);
    this.interactionText.setText(this.input.activePointer.isDown ? 'Tap to Interact' : 'Interact (E)');
    this.interactionText.setVisible(true);
  };
}