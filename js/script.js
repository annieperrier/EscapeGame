// three.js r69

var DEBUG = false;

var keymap = {
	'Q': 'Walk Left',
	'S': 'Walk Backwards',
	'W': 'Walk Forwards',
	'E': 'Walk Right',
	'R': 'Look Up',
	'A': 'Look Left',
	'D': 'Look Right',
	'F': 'Look Down'
};

// steps completed
// mapping: grate, login, chest, door
var steps = [false, false, false, false];
var stepscnt = 0;

var scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var mouse = { x: 0, y: 0 };

var height, width;
var myuser, art, quote;

// track the camera up/down look to set min/max
var updownangle = 0;

// list of items that are click targets
var targetList = [];

// height of head up display to substract from page height
var hudheight = 40;

var starttime = [0, 0, 2, 0, 0, 0];

var timer = new Timer();
var modal = new Modal();
var combo = new ComboLock();
var keypad = new KeyPad();

// no cheating!
var password = '09bdbbf9c288a3e2ebdc90a1615313a1';
var chestpass = [1, 9, 8, 4];
var keypass = '3276';

// wall limits to keep user inside the room
var maxWall = 950;
var minWall = -950;
if (DEBUG)
{
	// allow exiting the room a bit for model placement troubleshooting
	maxWall = 1500;
	minWall = -1500;
}

var jsonAssetsList = [
	{keyname: 'bookcase', filename: 'models/schedario.json'},
	{keyname: 'table', filename: 'models/Tavolo1.json'},
	{keyname: 'chest', filename: 'models/cassapanca.json'},
	{keyname: 'book', filename: 'models/Book.json'},
	{keyname: 'sofa', filename: 'models/Sofa.json'},
	{keyname: 'tv', filename: 'models/cctv_monitor.json'},
	{keyname: 'laptop', filename: 'models/apple-ibook-2001.json'},
	{keyname: 'deskglass', filename: 'models/Table_glass.json'},
	{keyname: 'deskplant', filename: 'models/Plante_en_vase.json'},
	{keyname: 'houseplant', filename: 'models/Houseplant.json'},
	{keyname: 'pencilholder', filename: 'models/Pencil_holder.json'}
];
var imgAssetsList = [
	// used directly for textures
	{keyname: 'combolock', filename: 'images/combolock-420x250.png'},
	{keyname: 'login', filename: 'images/login-540x390.png'},
	{keyname: 'crate', filename: 'images/crate-256x256.png'},
	{keyname: 'art', filename: 'images/art-850x850.jpg'},
	{keyname: 'grate', filename: 'images/grate-512x512.jpg'},
	{keyname: 'doormetal', filename: 'images/metal-256x256.png'},
	{keyname: 'wall', filename: 'images/concrete-512x512.png'},
	{keyname: 'floor', filename: 'images/wood-256x256.png'},
	{keyname: 'ceiling', filename: 'images/ceiling-256x256.png'},
	// required for models
	{keyname: 'bookcase', filename: 'models/schedario.png'},
	{keyname: 'table', filename: 'models/tavolo1.png'},
	{keyname: 'chest', filename: 'models/cassapanca.png'},
	{keyname: 'pencilholder', filename: 'models/penne.png'},
	{keyname: 'houseplant', filename: 'models/MAPLE-wh.jpg'}
];

var jsonAssets = {};
var imgAssets = {};

var jsonAssetsDoneCnt = 0;
var imgAssetsDoneCnt = 0;

$( document ).ready(function() {

	timer.init({
		timertime: starttime,
		update_callback : function(t) {
			for (var i = 0; i < t.length; i++)
				$("#timer"+i).html(t[i]);
		},
		done_callback : function() {
			runFailure();
		}
	});

	$("#startbutton").focus().click(function() {
		$("#welcome").hide();
		$("#footer .outgame").hide();
		$("#footer .ingame").show();
		$("#container").show();
		timer.startTimer();
	})

	$(".key").hover(function(event) {
		$(".keyinfo")
			.html(keymap[$(this).attr('id')]);
	}, function(event) {
		$(".keyinfo").html("");
	});

	$("#commandControls").click(function(event) {
		modal.fillModal($(".controlsContainer").clone(true));
		modal.showModal();
	});
	$("#modalClose a").click(function(event) {
		modal.hideModal();
	});

	for(var i = 0; i < imgAssetsList.length; i++)
	{
		loadImage(imgAssetsList[i].keyname, imgAssetsList[i].filename);
	}
	for(var i = 0; i < jsonAssetsList.length; i++)
	{
		loadJSON(jsonAssetsList[i].keyname, jsonAssetsList[i].filename);
	}
});

function checkLoadStatus()
{
	if (jsonAssetsDoneCnt == jsonAssetsList.length
		&& imgAssetsDoneCnt == imgAssetsList.length)
	{
		console.log('All assets loaded.');
		// show the start button
		$("#loadingnotice").hide();
		$("#startbutton").show().focus();
		// run things
		init();
		animate();
	}
}

function loadJSON(keyname, filename)
{
	var loader = new THREE.JSONLoader();
	loader.load(filename, function(geometry, materials) {
		console.log('JSON is loaded: ', keyname);
		jsonAssets[keyname] = {};
		jsonAssets[keyname].geometry = geometry;
		jsonAssets[keyname].materials = materials;
		jsonAssetsDoneCnt++;
		checkLoadStatus();
	});
}

function loadImage(keyname, filename)
{
	imgAssets[keyname] = {};
	var loader = new THREE.ImageUtils.loadTexture(filename, {}, function(texture) {
		console.log('Img is loaded: ', keyname);
		imgAssets[keyname].isdone = true;
		imgAssets[keyname].texture = texture;
		imgAssetsDoneCnt++;
		checkLoadStatus();
	});
}

function init()
{
	width = window.innerWidth;
	height = window.innerHeight-hudheight;
	
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 60, width/height, 1, 30000 );

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( width, height );
	var container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );
 
	// Create an event listener that resizes the renderer with the browser window.
	window.addEventListener('resize', function() {
		width = window.innerWidth;
		height = window.innerHeight-hudheight;
		renderer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	});

	// variables that will be reused for each item
	var geometry, material, i, len, mesh, texture;


	// MY USER HEAD
	geometry = new THREE.SphereGeometry(20, 16, 16);
	material = new THREE.MeshLambertMaterial( { color: 0x22bb22 } );
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(0, -325, 0);
	scene.add(mesh);
	// save globally for later reference
	myuser = mesh;

	// BOOKCASE
	material = new THREE.MeshFaceMaterial(jsonAssets['bookcase'].materials);
	mesh = new THREE.Mesh(jsonAssets['bookcase'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 160;
	mesh.position.set(740, -360, 920);
	scene.add(mesh);

	// TABLE
	material = new THREE.MeshFaceMaterial(jsonAssets['table'].materials);
	for (i = 0, len = material.materials.length; i < len; i++)
		material.materials[i].side = THREE.DoubleSide;
	mesh = new THREE.Mesh(jsonAssets['table'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 200;
	mesh.position.set(500, -530, -850);
	scene.add(mesh);

	// CHEST
	material = new THREE.MeshFaceMaterial(jsonAssets['chest'].materials);
	for (i = 0, len = material.materials.length; i < len; i++)
		material.materials[i].side = THREE.DoubleSide;
	mesh = new THREE.Mesh(jsonAssets['chest'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.rotation.y = -(Math.PI / 2);
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 200;
	mesh.position.set(870, -550, 300);
	mesh.itemname = 'chest';
	scene.add(mesh);
	targetList.push(mesh);

	// CHEST COMBO
	imgAssets['combolock'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['combolock'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['combolock'].texture.repeat.set( 1, 1 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['combolock'].texture } );
	geometry = new THREE.PlaneBufferGeometry(63, 37.5, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(770, -500, 295);
	mesh.rotation.y = -(Math.PI / 2);
	scene.add(mesh);

	// BOOKS
	// BOOK with hint
	material = new THREE.MeshFaceMaterial(jsonAssets['book'].materials);
	mesh = new THREE.Mesh(jsonAssets['book'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 350;
	mesh.position.set(620, -435, 900);
	mesh.itemname = 'book';
	scene.add(mesh);
	targetList.push(mesh);
	// BOOK generic
	mesh = new THREE.Mesh(jsonAssets['book'].geometry.clone(), material.clone());
	mesh.rotation.y = (Math.PI / 2);
	mesh.rotation.y = 1.1;
	mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 350;
	mesh.position.set(860, -278, 860);
	scene.add(mesh);

	// SOFA
	material = new THREE.MeshFaceMaterial(jsonAssets['sofa'].materials);
	mesh = new THREE.Mesh(jsonAssets['sofa'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 200;
	mesh.position.set(-890, -599, 600);
	scene.add(mesh);

	// QUOTE FRAME
	material = new THREE.MeshLambertMaterial({ color: 0x000000, side: THREE.DoubleSide });
	geometry = new THREE.PlaneBufferGeometry(640, 190, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-999, -225, 600);
	mesh.rotation.y = Math.PI / 2;
	scene.add(mesh);

	// QUOTE BACKING
	material = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
	geometry = new THREE.PlaneBufferGeometry(600, 150, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-998, -225, 600);
	mesh.rotation.y = Math.PI / 2;
	scene.add(mesh);

	// QUOTETEXT
	// create a canvas element
	var canvas1 = document.createElement('canvas');
	var context1 = canvas1.getContext('2d');
	context1.canvas.width = 600;
	context1.font = "Bold 36px Georgia";
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText('"if you want to keep a secret ', 25, 30);
	context1.fillText('you must also hide it', 120, 70);
	context1.fillText('from yourself"', 310, 110);
	// canvas contents will be used for a texture
	texture = new THREE.Texture(canvas1) 
	texture.needsUpdate = true;
	material = new THREE.MeshBasicMaterial( {map: texture, side:THREE.DoubleSide } );
	material.transparent = true;
	mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(canvas1.width, canvas1.height), material);
	mesh.position.set(-997, -240, 600);
	mesh.rotation.y = Math.PI / 2;
	mesh.itemname = 'quote';
	scene.add(mesh);
	targetList.push(mesh);
	// save globally for later reference
	quote = mesh;

	// TV
	material = new THREE.MeshFaceMaterial(jsonAssets['tv'].materials);
	mesh = new THREE.Mesh(jsonAssets['tv'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.rotation.y = -(Math.PI / 2);
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 150;
	mesh.position.set(960, -280, 300);
	mesh.itemname = 'tv';
	scene.add(mesh);
	targetList.push(mesh);

	// LAPTOP
	material = new THREE.MeshFaceMaterial(jsonAssets['laptop'].materials);
 	for (i = 0, len = material.materials.length; i < len; i++)
		material.materials[i].side = THREE.DoubleSide;
	mesh = new THREE.Mesh(jsonAssets['laptop'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.rotation.y = Math.PI / 9;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 200;
	mesh.position.set(480, -430, -810);
	scene.add(mesh);

	// LOGIN PAGE
	imgAssets['login'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['login'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['login'].texture.repeat.set( 1, 1 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['login'].texture } );
	geometry = new THREE.PlaneBufferGeometry(90, 65, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(462, -380, -860);
	mesh.rotation.y = 0.35;
	mesh.rotation.x = -0.2;
	mesh.rotation.z = 0.06;
	mesh.itemname = 'login';
	scene.add(mesh);
	targetList.push(mesh);

	// DESK GLASS
	material = new THREE.MeshFaceMaterial(jsonAssets['deskglass'].materials);
	mesh = new THREE.Mesh(jsonAssets['deskglass'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 8;
	mesh.position.set(570, -431, -910);
	scene.add(mesh);

	// DESK PLANT
	material = new THREE.MeshFaceMaterial(jsonAssets['deskplant'].materials);
	for (i = 0, len = material.materials.length; i < len; i++) 
		material.materials[i].side = THREE.DoubleSide;
	mesh = new THREE.Mesh(jsonAssets['deskplant'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 50;
	mesh.position.set(360, -245, -920);
	scene.add(mesh);

	// HOUSEPLANT
	material = new THREE.MeshFaceMaterial(jsonAssets['houseplant'].materials);
	mesh = new THREE.Mesh(jsonAssets['houseplant'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 350;
	mesh.position.set(400, -609, 920);
	scene.add(mesh);

	// PENCIL HOLDER
	material = new THREE.MeshFaceMaterial(jsonAssets['pencilholder'].materials);
	for (i = 0, len = material.materials.length; i < len; i++)
		material.materials[i].side = THREE.DoubleSide;
	mesh = new THREE.Mesh(jsonAssets['pencilholder'].geometry, material);
	mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 200;
	mesh.position.set(630, -435, -920);
	scene.add(mesh);

	// CRATE
	geometry = new THREE.BoxGeometry( 100, 100, 100 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['crate'].texture } );
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-690, -549, -950);
	scene.add(mesh);
	mesh = new THREE.Mesh(geometry.clone(), material.clone());
	mesh.position.set(-810, -549, -948);
	scene.add(mesh);
	mesh = new THREE.Mesh(geometry.clone(), material.clone());
	mesh.position.set(-700, -449, -948);
	scene.add(mesh);
	mesh = new THREE.Mesh(geometry.clone(), material.clone());
	mesh.position.set(-820, -449, -944);
	scene.add(mesh);
	mesh = new THREE.Mesh(geometry.clone(), material.clone());
	mesh.position.set(-750, -349, -940);
	scene.add(mesh);
	mesh = new THREE.Mesh(geometry.clone(), material.clone());
	mesh.position.set(-745, -249, -943);
	scene.add(mesh);

	// ART PICTURE
	imgAssets['art'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['art'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['art'].texture.repeat.set( 1, 1 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['art'].texture } );
	geometry = new THREE.PlaneBufferGeometry(300, 300, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-100, -180, -999);
	mesh.itemname = 'art';
	scene.add(mesh);
	targetList.push(mesh);
	// save globally for later reference
	art = mesh;

	// GRATE
	imgAssets['grate'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['grate'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['grate'].texture.repeat.set( 1, 1 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['grate'].texture, side: THREE.DoubleSide } );
	geometry = new THREE.PlaneBufferGeometry(256, 256, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(999, -400, -400);
	mesh.rotation.y = Math.PI / 2;
	mesh.itemname = 'grate';
	scene.add(mesh);
	targetList.push(mesh);

	// DOOR FRAME
	imgAssets['doormetal'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['doormetal'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['doormetal'].texture.repeat.set( 1, 1 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['doormetal'].texture } );
	geometry = new THREE.PlaneBufferGeometry(320, 560, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-999, -320, 0);
	mesh.rotation.y = Math.PI / 2;
	scene.add(mesh);

	// DOOR
	material = new THREE.MeshLambertMaterial({ color: 0x222222, side: THREE.DoubleSide });
	geometry = new THREE.PlaneBufferGeometry(300, 550, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-998, -325, 0);
	mesh.rotation.y = Math.PI / 2;
	scene.add(mesh);

	// DOOR PANEL
	imgAssets['doormetal'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['doormetal'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['doormetal'].texture.repeat.set( 1, 1 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['doormetal'].texture } );
	geometry = new THREE.PlaneBufferGeometry(50, 120, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-997, -315, -100);
	mesh.rotation.y = Math.PI / 2;
	mesh.itemname = 'door';
	scene.add(mesh);
	targetList.push(mesh);

	// DOOR SCREEN
	material = new THREE.MeshLambertMaterial({ color: 0x000000, side: THREE.DoubleSide });
	geometry = new THREE.PlaneBufferGeometry(40, 60, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-996, -290, -100);
	mesh.rotation.y = Math.PI / 2;
	scene.add(mesh);

	// DOOR KNOB
	geometry = new THREE.SphereGeometry(12, 10, 10);
	material = new THREE.MeshLambertMaterial( { color: 0x444444 } );
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(-990, -350, -100);
	scene.add(mesh);

	// SKYBOX
	material = new THREE.MeshBasicMaterial( { map: imgAssets['wall'].texture, side: THREE.BackSide } );
	geometry = new THREE.BoxGeometry(2000, 2000, 2000);
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	// FLOOR
	imgAssets['floor'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['floor'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['floor'].texture.repeat.set( 4, 4 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['floor'].texture, side: THREE.DoubleSide } );
	geometry = new THREE.PlaneBufferGeometry(2000, 2000, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = -600;
	mesh.rotation.x = Math.PI / 2;
	scene.add(mesh);

	// CEILING
	imgAssets['ceiling'].texture.wrapS = THREE.RepeatWrapping;
	imgAssets['ceiling'].texture.wrapT = THREE.RepeatWrapping;
	imgAssets['ceiling'].texture.repeat.set( 8, 8 );
	material = new THREE.MeshBasicMaterial( { map: imgAssets['ceiling'].texture, side: THREE.DoubleSide } );
	geometry = new THREE.PlaneBufferGeometry(2000, 2000, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = 300;
	mesh.rotation.x = Math.PI / 2;
	scene.add(mesh);

	// LIGHT
	// create a point light
	var pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
	pointLight.position.set(0, 300, 0);
	// add to the scene
	scene.add(pointLight);
	//////////////////////////////////////////////////////////////////////
	
	// when the mouse moves, call the given function
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
}

// ANIMATE
function animate() 
{
	requestAnimationFrame( animate );
	
	render();
	update();
}

// UPDATE
function update()
{
	// needs to be outside or holding down a key then closing
	// a modal causes a big jump
	var delta = clock.getDelta(); // seconds.

	// if the modal is on, ignore keypresses
	if ($("#modal").is(":hidden"))
	{
		var relativeCameraOffset = new THREE.Vector3(0,60,50);
		var cameraOffset = relativeCameraOffset.applyMatrix4( myuser.matrixWorld );

		camera.position.x = cameraOffset.x;
		camera.position.y = cameraOffset.y;
		camera.position.z = cameraOffset.z;
		
		camera.lookAt( new THREE.Vector3(myuser.position.x, myuser.position.y+45, myuser.position.z));
		camera.rotateOnAxis( new THREE.Vector3(1,0,0), updownangle);

		var moveDistance = 200 * delta; // 200 pixels per second
		var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
		
		// local transformations

		// the below gets run on next loop by code above

		// move forwards/backwards/left/right
		// prevent exiting the world's 4 walls
		if ( keyboard.pressed("W") )
		{
			var v = new THREE.Vector3(0,0,-moveDistance);
			var r = new THREE.Matrix4();
			r.makeRotationFromQuaternion(myuser.quaternion);
			v.applyMatrix4(r);
			var z = myuser.position.z + v.z;
			var x = myuser.position.x + v.x;

			if (z < maxWall && z > minWall && x < maxWall && x > minWall)
				myuser.position.set(myuser.position.x+v.x, myuser.position.y+v.y, myuser.position.z+v.z);
		}
		if ( keyboard.pressed("S") )
		{
			var v = new THREE.Vector3(0,0,moveDistance);
			var r = new THREE.Matrix4();
			r.makeRotationFromQuaternion(myuser.quaternion);
			v.applyMatrix4(r);
			var z = myuser.position.z + v.z;
			var x = myuser.position.x + v.x;

			if (z < maxWall && z > minWall && x < maxWall && x > minWall)
				myuser.position.set(myuser.position.x+v.x, myuser.position.y+v.y, myuser.position.z+v.z);
		}
		if ( keyboard.pressed("Q") )
		{
			var v = new THREE.Vector3(-moveDistance,0,0);
			var r = new THREE.Matrix4();
			r.makeRotationFromQuaternion(myuser.quaternion);
			v.applyMatrix4(r);
			var z = myuser.position.z + v.z;
			var x = myuser.position.x + v.x;

			if (z < maxWall && z > minWall && x < maxWall && x > minWall)
				myuser.position.set(myuser.position.x+v.x, myuser.position.y+v.y, myuser.position.z+v.z);
		}
		if ( keyboard.pressed("E") )
		{
			var v = new THREE.Vector3(moveDistance,0,0);
			var r = new THREE.Matrix4();
			r.makeRotationFromQuaternion(myuser.quaternion);
			v.applyMatrix4(r);
			var z = myuser.position.z + v.z;
			var x = myuser.position.x + v.x;

			if (z < maxWall && z > minWall && x < maxWall && x > minWall)
				myuser.position.set(myuser.position.x+v.x, myuser.position.y+v.y, myuser.position.z+v.z);
		}

		// rotate left/right
		var rotation_matrix = new THREE.Matrix4().identity();
		if ( keyboard.pressed("A") )
			myuser.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
		if ( keyboard.pressed("D") )
			myuser.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);

		// look up/down
		if ( keyboard.pressed("R") )
		{
			updownangle += rotateAngle;
			if (updownangle > 0.8)
				updownangle = 0.8;
		}
		if ( keyboard.pressed("F") )
		{
			updownangle -= rotateAngle;
			if (updownangle < -0.4)
				updownangle = -0.4;
		}
		
		if (DEBUG)
		{
			// rotate up/down, then you can walk through floor/ceiling
			if ( keyboard.pressed("T") )
				myuser.rotateOnAxis( new THREE.Vector3(1,0,0), rotateAngle);
			if ( keyboard.pressed("G") )
				myuser.rotateOnAxis( new THREE.Vector3(1,0,0), -rotateAngle);
		}
	}
}

// RENDER
function render()
{
	renderer.render(scene, camera);
}

function onDocumentMouseDown( event ) 
{
	// if the modal is on, ignore keypresses
	if (!modal.isShown && $("#container").is(':visible'))
	{
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		// event.preventDefault();
		
		console.log("Click.");
		
		// update the mouse variable
		mouse.x = ( event.clientX / width ) * 2 - 1;
		mouse.y = - ( event.clientY / height ) * 2 + 1;
		
		// find intersections

		// create a Ray with origin at the mouse position
		//   and direction into the scene (camera direction)
		var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
		vector.unproject( camera );
		var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

		// create an array containing all objects in the scene with which the ray intersects
		var intersects = ray.intersectObjects( targetList );
		
		// if there is one (or more) intersections
		if ( intersects.length > 0 )
		{
			console.log("Hit " + intersects[0].object.itemname + ' @ ' +toString( intersects[0].point ) );
			runClicked(intersects[0]);
		}
	}
}

function toString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; }

///////////////////////////////////////////////////////////////////////////////

function increaseStep(stepid)
{
	if (!steps[stepid])
	{
		steps[stepid] = true;
		stepscnt++;

		if (steps.length == stepscnt)
		{
			// winner!
			console.log('Winner');
			runSuccess();
		}
	}
}

function runSuccess()
{
	var t = timer.stopTimer();
	var dt = timer.substractTimes(starttime, t);
	for (var i = 0; i < dt.length; i++)
		$("#finaltimer"+i).html(dt[i]);
	$("#footer .ingame").hide();
	$("#footer .outgame").show();
	$("#container").hide();
	$("#success").show();

	setTimeout(function() {
		modal.hideModal();
	}, 500);
}

function runFailure()
{
	$("#footer .ingame").hide();
	$("#footer .outgame").show();
	$("#container").hide();
	$("#failure").show();
}

function runClicked(item)
{
	console.log('Running click for: '+ item.object.itemname);
	switch(item.object.itemname)
	{
		case 'art':
			runArt();
			break;
		case 'login':
			runLogin();
			break;
		case 'chest':
			runChest();
			break;
		case 'book':
			runBook();
			break;
		case 'door':
			runDoor();
			break;
		case 'quote':
			runQuote();
			break;
		case 'tv':
			runTv();
			break;
		case 'grate':
			runGrate();
			break;
	}
}

///////////////////////////////////////////////////////////////////////////////

function runArt()
{
	art.rotation.z = 0.20;
}

///////////////////////////////////////////////////////////////////////////////

function runLogin()
{
	if (steps[1])
		var lp = getLoginUnlockedView();
	else
		var lp = getLoginLockedView();

	modal.fillModal(lp);
	modal.showModal();
	setTimeout(function(){
		$('#loginLocked .password').focus();
	}, 0);
}

function getLoginLockedView()
{
	var lp = $("#loginLockedTemplate").clone();
	lp.attr('id', "loginLocked");
	lp.find('.cancel').click(function(event) {
		modal.hideModal();
	});
	lp.find('.ok').click(function(event) {
		if (checkPassword($("#loginLocked .password").val()))
		{
			console.log('password success');
			$("#loginLocked .msg").removeClass('denied').addClass('success').html('Access Granted');
			increaseStep(1);
			setTimeout(function() {
				var lp = getLoginUnlockedView();
				modal.fillModal(lp);
			}, 500);
		}
		else
		{
			console.log('password fail');
			$("#loginLocked .msg").addClass('denied').html('Access Denied');
			setTimeout(function() {
				$("#loginLocked .msg").removeClass('denied').html();
			}, 2000);
		}
	});
	lp.find('.password').bind('keypress', function(e) {
		if(e.keyCode==13){
			$('#loginLocked .ok').click();
		}
	});

	return lp;
}

function getLoginUnlockedView()
{
	var lp = $("#loginUnlockedTemplate").clone();
	lp.attr('id', "loginUnLocked");

	return lp;
}

function checkPassword(pass)
{
	var m = md5(pass);
	console.log('checking password:', pass);
	if (m == password)
		return true;
	return false;
}

///////////////////////////////////////////////////////////////////////////////

function runChest()
{
	if (steps[2])
		var lp = getChestUnlockedView();
	else
		var lp = getChestLockedView();

	modal.fillModal(lp);
	combo.init();
	modal.showModal();
}

function getChestLockedView()
{
	var lp = $("#chestLockedTemplate").clone();
	lp.attr('id', "chestLocked");

	lp.find('.cancel').click(function(event) {
		modal.hideModal();
	});
	lp.find('.ok').click(function(event) {
		if (checkChestLock(combo.getCombination()))
		{
			console.log('chest lock success');
			$("#chestLocked .msg").removeClass('denied').addClass('success').html('Chest Opened');
			increaseStep(2);
			setTimeout(function() {
				var lp = getChestUnlockedView();
				modal.fillModal(lp);
			}, 500);
		}
		else
		{
			console.log('check lock fail');
			$("#chestLocked .msg").addClass('denied').html('Invalid Combination');
			setTimeout(function() {
				$("#chestLocked .msg").removeClass('denied').html();
			}, 2000);
		}
	});
	return lp;
}

function getChestUnlockedView()
{
	var lp = $("#chestUnlockedTemplate").clone();
	lp.attr('id', "chestUnLocked");

	return lp;
}

// combos - array of combo numbers 0-3
function checkChestLock(combo)
{
	for (var i = 0; i < 4; i++)
	{
		if (combo[i] != chestpass[i])
			return false;
	}
	return true;
}

///////////////////////////////////////////////////////////////////////////////

function runBook()
{
	var lp = $("#bookViewTemplate").clone();
	lp.attr('id', "bookView");

	if (steps[0])
		lp.find('.solvedgrate').removeClass('hidden');
	if (steps[1])
		lp.find('.solvedlogin').removeClass('hidden');
	if (steps[2])
		lp.find('.solvedchest').removeClass('hidden');
	if (steps[0] && steps[1] && steps[2])
		lp.find('.solvedallclues').removeClass('hidden');

	modal.fillModal(lp);
	modal.showModal();
}

///////////////////////////////////////////////////////////////////////////////

function runDoor()
{
	var lp = $("#doorViewTemplate").clone();
	lp.attr('id', "doorView");

	modal.fillModal(lp);
	keypad.init(keypass, checkDoorPass);
	modal.showModal();
}

function checkDoorPass(res)
{
	if (res)
	{
		console.log('check door success');
		$("#doorView .msg").removeClass('denied').addClass('success').html('Door Opened');
		increaseStep(3);
	}
	else
	{
		console.log('check door fail');
		$("#doorView .msg").addClass('denied').html('Invalid Passphrase');
		setTimeout(function() {
			$("#doorView .msg").removeClass('denied').html();
		}, 2000);
	}
}
///////////////////////////////////////////////////////////////////////////////

function runQuote()
{
	scene.remove(quote);

	// QUOTETEXT
	// create a canvas element
	var canvas1 = document.createElement('canvas');
	var context1 = canvas1.getContext('2d');
	context1.canvas.width = 600;
	context1.font = "Bold 36px Georgia";

	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText('"if y', 25, 30);
	context1.fillStyle = "rgba(16,100,230,1)"; // blue
	context1.fillText('o', 100, 30);
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText('u want t', 122, 30);
	context1.fillStyle = "rgba(215,65,45,1)"; // red
	context1.fillText('o', 274, 30);
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText(' keep a secret ', 295, 30);

	context1.fillText('y', 120, 70);
	context1.fillStyle = "rgba(255,180,0,1)"; // yellow
	context1.fillText('o', 142, 70);
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText('u must als', 163, 70);
	context1.fillStyle = "rgba(16,100,230,1)"; // blue
	context1.fillText('o', 354, 70);
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText(' hide it', 374, 70);

	context1.fillText('fr', 310, 110);
	context1.fillStyle = "rgba(0,150,90,1)";
	context1.fillText('o', 342, 110);
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText('m y', 366, 110);
	context1.fillStyle = "rgba(215,65,45,1)"; // red
	context1.fillText('o', 432, 110);
	context1.fillStyle = "rgba(0,0,0,1)";
	context1.fillText('urself"', 455, 110);

	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas1) 
	texture.needsUpdate = true;
	var material = new THREE.MeshBasicMaterial( {map: texture, side:THREE.DoubleSide } );
	material.transparent = true;
	var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(canvas1.width, canvas1.height), material);
	mesh.position.set(-996, -240, 600);
	mesh.rotation.y = Math.PI / 2;
	scene.add(mesh);
}

///////////////////////////////////////////////////////////////////////////////

function runTv()
{
	var win = window.open('http://google.com', '_blank');
  	win.focus();
}

///////////////////////////////////////////////////////////////////////////////

function runGrate()
{
	var lp = $("#grateViewTemplate").clone();
	lp.attr('id', "grateView");

	increaseStep(0);

	modal.fillModal(lp);
	modal.showModal();
}

///////////////////////////////////////////////////////////////////////////////

function Timer()
{
	this.timertime = [];
	this.timertime[0] = 0; // H1
	this.timertime[1] = 0; // H2
	this.timertime[2] = 0; // M1
	this.timertime[3] = 0; // M2
	this.timertime[4] = 0; // S1
	this.timertime[5] = 0; // S2

	this.timerinterval = null;

	this.update_callback = null;
	this.done_callback = null;
};

Timer.prototype.init = function(config)
{
	// copy so we don't overwrite config
	this.timertime[0] = config.timertime[0];
	this.timertime[1] = config.timertime[1];
	this.timertime[2] = config.timertime[2];
	this.timertime[3] = config.timertime[3];
	this.timertime[4] = config.timertime[4];
	this.timertime[5] = config.timertime[5];
	this.update_callback = (config.update_callback ? config.update_callback : null);
	this.done_callback = (config.done_callback ? config.done_callback : null);
};

Timer.prototype.startTimer = function()
{
	var self = this;
	this.timerinterval = setInterval(function() {
		self.runTimer();
	}, 1000);
};

/**
 * Decrease time by one second
 */
Timer.prototype.decreaseTimer = function(pos)
{
	if (this.timertime[pos] == 0)
	{
		if (pos%2 == 1)
			this.timertime[pos] = 9;
		else
			this.timertime[pos] = 5;
		this.decreaseTimer(pos-1);
	}
	else
	{
		this.timertime[pos]--;
	}
};

Timer.prototype.runTimer = function()
{
	this.decreaseTimer(this.timertime.length-1);
	
	// process update callback
	if (this.update_callback)
	{
		this.update_callback(this.timertime);
	}

	// check if at zero
	var isdone = 0;
	for (var i=0; i < this.timertime.length; i++)
	{
		if (this.timertime[i] == 0)
			isdone++;
	}
	// trigger if done
	if (this.timertime.length == isdone)
		this.doneTimer();
};

Timer.prototype.stopTimer = function()
{
	clearInterval(this.timerinterval);
	return this.timertime;
};

Timer.prototype.doneTimer = function()
{
	console.log("Timer is done");
	clearInterval(this.timerinterval);
	if (this.done_callback)
		this.done_callback();
};

/**
 * Substract timertime: a - b
 */
Timer.prototype.substractTimes = function(a, b)
{
	var newtime = [];
	newtime[0] = 0;
	newtime[1] = 0;
	newtime[2] = 0;
	newtime[3] = 0;
	newtime[4] = 0;
	newtime[5] = 0;

	if (a.length != 6 || b.length != 6)
		return newtime;

	var borrow = false;
	var aa, bb, borrowval;
	for (var i = 5; i >= 0; i--)
	{
		aa = a[i];
		bb = b[i];
		// track counting 0-9 or 0-6 for minutes, hours
		borrowval = (i % 2) ? 10 : 6;
		if (borrow)
		{
			if (aa > 0)
			{
				aa--;
				borrow = false;
			}
			else
			{
				aa += borrowval-1;
				// leave borrow on
			}

		}
		if (aa >= bb)
			newtime[i] = aa - bb;
		else
		{
			newtime[i] = aa+borrowval - bb;
			borrow = true;
		}
	}
	console.log('substract result: ', a, b, newtime);

	return newtime;
};

///////////////////////////////////////////////////////////////////////////////

function Modal()
{
	this.isShown = false;
};

Modal.prototype.showModal = function()
{
	$("#dimmer").show();
	$("#modal").fadeIn();
	this.isShown = true;
};

Modal.prototype.hideModal = function()
{
	$("#dimmer").hide();
	$("#modal").fadeOut();
	$("#modalContent").html('');
	this.isShown = false;
};

Modal.prototype.fillModal = function(c)
{
	$("#modalContent").html(c);
};

///////////////////////////////////////////////////////////////////////////////

function ComboLock()
{
  this.mouseDownY = null;
  this.mouseDownItem = null;
};

ComboLock.prototype.init = function()
{
  var self = this;
  
  $(".lockDigitContainer").mousedown(function(evt) {
    self.mouseDownItem = $(this);
    self.mouseDownItem.addClass('depressed');
    self.mouseDownY = evt.clientY;
  });
  
  $(document).mouseup(function(evt) {
    if (self.mouseDownY)
    {
      var dir = 'down'
      if (self.mouseDownY > evt.clientY)
        var dir = 'up';
      
      self.rotateDirection(dir, self.mouseDownItem);
      self.mouseDownItem.removeClass('depressed');
      
      self.mouseDownY = null;
      self.mouseDownItem = null;
    }
  });
};

/**
 * direction: up | down
 * item: jquery object
 */
ComboLock.prototype.rotateDirection = function(direction, item)
{
  var checkdigit = 0;
  var newdigit = 9;
  var additiondigit = -1;
  if ('up' == direction)
  {
    checkdigit = 9;
    newdigit = 0;
    additiondigit = 1;
  }

  var p = parseInt(item.find('.lockDigitPrev').html());
  var c = parseInt(item.find('.lockDigitCur').html());
  var n = parseInt(item.find('.lockDigitNext').html());

  p = (p == checkdigit) ? newdigit : p + additiondigit;
  c = (c == checkdigit) ? newdigit : c + additiondigit;
  n = (n == checkdigit) ? newdigit : n + additiondigit;

  item.find('.lockDigitPrev').html(p);
  item.find('.lockDigitCur').html(c);
  item.find('.lockDigitNext').html(n);
};

ComboLock.prototype.getCombination = function()
{
	var res = [];
	for (var i = 0; i < 4; i++)
		res.push(parseInt($(".digit"+i+" .lockDigitCur").html()));
	return res;
};

///////////////////////////////////////////////////////////////////////////////

function KeyPad()
{
	this.typedpass = '';
	this.pass = null;
}

KeyPad.prototype.init = function(pass, cb)
{
	var self = this;

	this.pass = pass;
	this.cb = cb;

	$(".keypadDigit").click(function() {
		var d = $(this).html();
		if ("#" == d)
			self.checkPass();
		else if ("*" == d)
			self.clearStack();
		else
		{
			d = parseInt(d);
			self.typedpass+=d;
		}
	});
}

KeyPad.prototype.clearStack = function()
{
	this.typedpass = '';
}

KeyPad.prototype.checkPass = function()
{
	if (this.typedpass == this.pass)
		this.cb(true);
	else
	{
		this.typedpass = "";
		this.cb(false);
	}
}