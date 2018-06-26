

bringToFront = function() {
	if (this.parent) {
		var parent = this.parent;
		parent.removeChild(this);
		parent.addChild(this);
	}
}

PIXI.Sprite.prototype.bringToFront = bringToFront
PIXI.Graphics.prototype.bringToFront = bringToFront

function degToRad (angle) {

 	return angle * (Math.PI / 180);
}

function radToDeg (angle) {

	return angle * (180 / Math.PI);
}

function lerp(v0, v1, t) {

    return v0*(1-t)+v1*t
}




angular.module('YtGL', [])

/*The master controller*/
.controller('master', function master($scope) {
	m = $scope

	m.dt = 0
	
	m._ts = 0

	m.assets = [
		['indoor', 'indoor.json'],
		['outdoor', 'outdoor.json'],
		['pokemon-overworld-1-100', 'pokemon-overworld-1-100.json'],
		['pokemon-overworld-101-200', 'pokemon-overworld-101-200.json'],
		['pokemon-overworld-201-300', 'pokemon-overworld-201-300.json'],
		['pokemon-overworld-301-400', 'pokemon-overworld-301-400.json'],
		['pokemon-overworld-401-492', 'pokemon-overworld-401-492.json'],
		['pokemon-overworld-493', 'pokemon-overworld-493.json'],
		['trainers-battles', 'trainers-battles.json'],
		['pkmnTilesX2', 'pkmnTilesX2.json'],
		['players-overworld', 'players-overworld.json'],
	]

	m.dom = {
		blackScreen: $('.blackScreen'),
		whiteScreen: $('.whiteScreen')
	}

	m.defaults = {
		game: {
			width: 640,
			height: 480,
			tileSize: 32,
			x: 0,
			y: 0,
			introSpeed: 8,
			speed: 3,
			gameSpeed: 3,
			blackScreenFadeTime: 200,
			tail: 0.1,
			cameraLockedToPlayer: false,
			intro: true,
			possibleDirections: [ 'down', 'left', 'right', 'up']
		},
		player: {
			x: 0,
			y: 0,
			_X: 0,
			_Y: 0,
			sprites: {},
			direction: 'right',
			yOffset: -10
		}
	}

	m.lastDoors = {}
	
	m.mapCache = {}

	m.noop = function noop () {/*Performs no action- good for compilers though...*/}

	m.initInput = function () {
		m.keys = {
			38: false, // Up
			37: false, // Left
			40: false, // Down
			39: false, // Right

			

			87:	false, // W
			65: false, // A
			83:	false, // S
			68: false, // D
			


			13: false, // Enter

			
			90: false, // Z
			88: false, // X
			

			/*Debug below*/
			91: false, // Left Cmd
			93: false, // Right Cmd
			18: false, // Alt
			17: false, // Control
			16: false // Shift
		}

		m.key = {
			UP:    38, // Up
			LEFT:  37, // Left
			DOWN:  40, // Down
			RIGHT: 39, // Right

			

			W: 87, // W
			A: 65, // A
			S: 83, // S
			D: 68, // D
			


			ENTER: 13, // Enter

			
			Z: 90, // Z
			X: 88, // X
			

			/*Debug below*/
			LCMD:  91, // Left Cmd
			RCMD:  93, // Right Cmd
			CTRL:  17, // Right Cmd
			ALT:   18, // Alt
			SHIFT: 16 // Shift
		}

		$(window).on('keydown', function (e) {
			m.keys[e.which] = true
		})

		$(window).on('keyup', function (e) {
			m.keys[e.which] = false
		})
	}

	m.jsonClone = function (obj) {

		return JSON.parse(JSON.stringify(obj))
	}

	m.getKey = function (key) {

		return m.keys[m.key[key]]
	}

	m.pointInRect = function (x, y) {
 		for (var i in colliders) {
 			var c = colliders[i]
	 	    x1 = Math.min(c.start.x, c.end.x);
		    x2 = Math.max(c.start.x, c.end.x);
		    y1 = Math.min(c.start.y, c.end.y);
		    y2 = Math.max(c.start.y, c.end.y);
		    if ((x1 <= x ) && ( x <= x2) && (y1 <= y) && (y <= y2)) {
		        return true;
		    } else {
	    	}
	    }
		return false;
	}

	m.intersectRect = function (r1) {
		colliders = colliders
		for (var i in colliders) {
 			var r2 = colliders[i],
 			x1 = Math.min(r2.start.x, r2.end.x),
			x2 = Math.max(r2.start.x, r2.end.x),
			y1 = Math.min(r2.start.y, r2.end.y),
			y2 = Math.max(r2.start.y, r2.end.y)
 				t = !(

 					x1 > r1.x + r1.offset.right  || 
		        	x2 < r1.x + r1.offset.left || 
		        	y1 > r1.y + r1.offset.bottom ||
		        	y2 < r1.y + r1.offset.top
	           );


			if (t) return t
		}
		return false
	}

	m.stages = {
		main: new PIXI.Container(),
		debug: new PIXI.Container()
	}

	m.createAnimatedClip = function (ids, pixiStage, opts) {
	    var frames = [];

	    for (var i in ids) {
	        frames.push(PIXI.Texture.fromFrame(ids[i]));
	    }

	    var anim = new PIXI.extras.AnimatedSprite(frames);

	    for (var i in opts) {
	    	anim[i] = opts[i]
		}

	    if (pixiStage) pixiStage.addChild(anim);

	    return anim
	}

	m.init = function () {

		m.renderer = new PIXI.autoDetectRenderer({
			width: m.defaults.game.width,
			height: m.defaults.game.height,
			antialias: false,
			powerPreference: 'high-performance'
		})
		m.renderer.backgroundColor = 0x061639;


		$('.game').append(m.renderer.view)

		var loader  = new PIXI.loaders.Loader()

		/*Main stage items*/
		for (var i in m.assets) {
			loader.add(m.assets[i][0], 'sys/img/assets/' + m.assets[i][1])
		}

		loader.load(m.loaderFinished)

		m.initInput()
	}

	m.loaderFinished = function (loader, res) {
		m.res = res
		m.loop()

		//m.setPage('main-menu') // This would be correct noramlly
		
		//debug
			m.setPage('game')
			m.loadMap('town')
	}

	m.setPage = function (newPage) {
		m.$root.pageChanging = true;
		m.$applyAsync()

		setTimeout(function () {
			m.$root.page = newPage
			setTimeout(function () {
				m.$root.pageChanging = false;
				m.$applyAsync()
			}, 20)
			m.$applyAsync()
			
		}, 350)
	}

	m.toTile = function (n, tileSize) {
		tileSize = tileSize || m.game.tileSize
		return Math.floor(n / tileSize)
	}

	m.fromTile = function (n, tileSize) {
		tileSize = tileSize || m.game.tileSize
		return Math.floor((n * tileSize) / tileSize)  * tileSize
	}

	//Loads the map from url, and builds the map
	m.loadMap = function (filename, callback) {
		var playerTempContainer
		if (!m.game) {
			m.game = m.jsonClone(m.defaults.game)
			m.game.player = m.jsonClone(m.defaults.player)
		}
		else {
			var player = m.game.player
			m.game = m.jsonClone(m.defaults.game)
			m.game.player = player
			playerTempContainer = new PIXI.Container()
			for (var i in m.game.player.sprites) {
				playerTempContainer.addChild(m.game.player.sprites[i])
			}
		}

		m.game.speed = m.game.introSpeed 
		m.game.cameraLockedToPlayer = false

		var nextStep = function (data) {
			m.mapCache[filename] = data
			m.stages.main = new PIXI.Container()
			m.game.playing = true
			m.game.mapRaw = data
			m.game.map = {
				name: filename,
				layers: {},
				objects: new PIXI.Container()
			}

			m.game.tileSize = data.tilewidth



			for (var layer in data.layers) {
				if (data.layers[layer].type != 'objectgroup') {

					var md = new PIXI.Container()
					for (var x in data.layers[layer].data) {
						var sprite = new PIXI.Sprite (m.res.pkmnTilesX2.textures['tiles_' + (data.layers[layer].data[x] - 1) + '.png'])
						sprite.position.x = (x % data.layers[layer].width) * m.game.tileSize
						sprite.position.y = (Math.floor(x / data.layers[layer].width)).toFixed(0) * m.game.tileSize
						sprite.visible = false
						md.addChild(sprite)
					}

					m.game.map.layers[data.layers[layer].name] = md
					m.stages.main.addChild(md)

				}

				//Objects and player/s
				else {

					for (var i in data.layers[layer].objects) {
						var o = data.layers[layer].objects[i]


						//Add the player
						if (o.properties && o.properties.isPlayer) {
							
							m.game.player.properties = o.properties
								m.game.map.playerStart = {
									x: m.toTile(o.x),
									y: m.toTile(o.y) - 1
								}
							//Freshly loaded game
							if (!m.game.player.sprites[m.game.possibleDirections[0]]) {
								m.game.player._X = m.toTile(o.x)
								m.game.player._Y = m.toTile(o.y) - 1

								var playerTileset = [
									'HGSS_220_walk_0.png',
									'HGSS_220_walk_1.png',
									'HGSS_220_walk_2.png',
									'HGSS_220_walk_3.png',
									'HGSS_220_walk_4.png',
									'HGSS_220_walk_5.png',
									'HGSS_220_walk_6.png',
									'HGSS_220_walk_7.png',
									'HGSS_220_walk_8.png',
									'HGSS_220_walk_9.png',
									'HGSS_220_walk_10.png',
									'HGSS_220_walk_11.png',
									'HGSS_220_walk_12.png',
									'HGSS_220_walk_13.png',
									'HGSS_220_walk_14.png',
									'HGSS_220_walk_15.png'
								]

								for (var i in m.game.possibleDirections) {
									var t = [],
										name = m.game.possibleDirections[i]

									t.push(playerTileset[i * 4])
									t.push(playerTileset[i * 4 + 1])
									t.push(playerTileset[i * 4 + 2])
									t.push(playerTileset[i * 4 + 3])

									m.game.player.sprites[name] = m.createAnimatedClip(t)
									m.game.player.sprites[name].position.x = (m.game.player._X * m.game.tileSize)
									m.game.player.sprites[name].position.y = (m.game.player._Y * m.game.tileSize) + m.game.player.yOffset



									m.stages.main.addChild(m.game.player.sprites[name])
									if (name != m.game.player.direction) m.game.player.sprites[name].alpha = 0
								}
							}

							//Loading new map
							else if (playerTempContainer) {
								for (var i in m.game.player.sprites) {
									m.stages.main.addChild(m.game.player.sprites[i])
									
									for (var i in m.game.possibleDirections) {
										var t = [],
											name = m.game.possibleDirections[i]

										m.game.player.sprites[name].position.x = (m.game.player._X * m.game.tileSize)
										m.game.player.sprites[name].position.y = (m.game.player._Y * m.game.tileSize) + m.game.player.yOffset
									}
								}

								m.game.player.properties = o.properties
							}
						}

						//Other objects
						else {
							var sprite = new PIXI.Sprite (m.res.pkmnTilesX2.textures['tiles_' + (o.gid - 1) + '.png'])
							sprite.properties = o.properties
							if (sprite.properties && sprite.properties.doorway) sprite.alpha = 0
							sprite.position.x = m.fromTile(m.toTile(o.x) + 2)
							sprite.position.y = m.fromTile(m.toTile(o.y) - 3)
							m.game.map.objects.addChild(sprite)
						}
					}
				}
			}

			m.stages.main.addChild(m.game.map.objects)

			if (callback) callback()
		}

		if (m.mapCache[filename]) nextStep(m.mapCache[filename])
		else $.getJSON('sys/maps/' + filename + '.json').success(nextStep)
	}

	//Handles the fade & switch
	m.switchMap = function (newMap, obj, ignoreLastDoor, callback) {
		m.mapSwitching = true
		m.lastDoors[m.game.map.name] = obj
		m.$applyAsync()


		var _t = new Date().getTime()
		m.loadMap(newMap, function () {
			var newTimeout = new Date().getTime() - _t < m.game.blackScreenFadeTime ? m.game.blackScreenFadeTime : 16
			var newDir
			if (!ignoreLastDoor && m.lastDoors[newMap]) {
				if (m.lastDoors[newMap].properties && m.lastDoors[newMap].properties.direction) {
					newDir = m.lastDoors[newMap].properties.direction
					m.game.player.direction = m.lastDoors[newMap].properties.direction
				}
				m.game.player._X = (m.lastDoors[newMap].x / m.game.tileSize)
				m.game.player._Y = (m.lastDoors[newMap].y / m.game.tileSize)
			}

			m.game.player.x = m.game.player._X
			m.game.player.y = m.game.player._Y

			if (newDir) {
				if (newDir == 'down') {
					setTimeout(function () {
						m.game.player._Y++
						m.mapSwitching = false
						m.$applyAsync()
					}, m.game.blackScreenFadeTime + 100)
				}
			}
			else {
				m.stages.main.position.x = -((m.game.player.x * m.game.tileSize)) + m.defaults.game.width / 2
				m.stages.main.position.y = -((m.game.player.y * m.game.tileSize)) + m.defaults.game.height / 2
				m.mapSwitching = false
			}
			m.$applyAsync()
			if (callback) callback()
		})
	}
	
	m.count = 9999

	m.loop = function () {
		var ms = new Date().getTime()

		if (m._ts) {
			m.dt = (ms - m._ts) * 0.001
		}

		m._ts = ms


		if (m.game && m.game.playing) {
			//if (m.game.player) console.log(m.game.player._Y)
			//Do stuff to the stages
			// for (var i in m.stages) {
			// 	var s = m.stages[i]

			// }

			m.movePlayer()
			
			m.moveCamera()
			m.getObject()

			var distX = m.game.player.x - m.game.player._X,
				distY = m.game.player.y - m.game.player._Y
			if (m.count > 8 && (Math.abs(distX) > m.game.tail || Math.abs(distY) > m.game.tail)) {
				m.revealMap()
				m.count = 0
				m.dirty = false
			}
			else {
				m.count++
			}
			m.renderer.render(m.stages.main)
		}
		requestAnimationFrame(m.loop)
	}

	m.percent = function (a, b) {

		return (a / b) * 100;
	}

	m.moveCamera = function () {

		if (!m.game || !m.game.player || !m.game.player.sprites || !m.game.player.sprites[m.game.possibleDirections[0]]) return false

		var distX = m.game.player.x - m.game.player._X,
			distY = m.game.player.y - m.game.player._Y,
			animate = false

		if (distX < 0 && Math.abs(distX) > m.game.tail) {
			m.game.player.x += (m.dt * m.game.speed)
		}
		else if (distX > 0 && Math.abs(distX) > m.game.tail) {
			m.game.player.x -= (m.dt * m.game.speed)
		}
		else if (Math.abs(distX) <= m.game.tail) {
			m.game.player.x = m.game.player._X
		}



		if (distY < 0 && Math.abs(distY) > m.game.tail) {
			m.game.player.y += (m.dt * m.game.speed)
		}
		else if (distY > 0 && Math.abs(distY) > m.game.tail) {
			m.game.player.y-= (m.dt * m.game.speed)
		}
		else if (Math.abs(distY) <= m.game.tail) {
			m.game.player.y = m.game.player._Y
		}

		if (m.game.cameraLockedToPlayer) {

			var fPercent = ((Math.abs(distX || distY)/m.game.tail) * 10)
			
			if (fPercent < 40 && fPercent > 0) {
				m.game.player.sprites[m.game.player.direction].gotoAndStop(3)
			}
			else if (fPercent < 65) {
				m.game.player.sprites[m.game.player.direction].gotoAndStop(2)

			}
			else if (fPercent < 85) {
				m.game.player.sprites[m.game.player.direction].gotoAndStop(1)
			}
			else {
				m.game.player.sprites[m.game.player.direction].gotoAndStop(0)
			}
		}





		//move the camera to the correct position
		m.stages.main.position.x = -((m.game.player.x * m.game.tileSize)) + m.defaults.game.width / 2
		m.stages.main.position.y = -((m.game.player.y * m.game.tileSize)) + m.defaults.game.height / 2

		if (Math.abs(distX || distY) == 0) {
			m.game.cameraLockedToPlayer = true
			m.game.speed = m.game.gameSpeed
		}


		//Get the player sprite data ready
		for(var i in m.game.possibleDirections) {
			var list = m.game.possibleDirections[i]
			m.game.player.sprites[list].alpha = 0
			if (m.game.cameraLockedToPlayer) {
				if (!m.game.player.sprites[list].playing) {
					m.game.player.sprites[list].loop = false
				}
				m.game.player.sprites[list].position.x = (m.game.player.x * m.game.tileSize)
				m.game.player.sprites[list].position.y = (m.game.player.y * m.game.tileSize) + m.game.player.yOffset
			}
		}

		m.game.player.sprites[m.game.player.direction].alpha = 1
	}

	m.checkCollison = function (x, y) {
		for (var i in m.game.mapRaw.layers) {
			var layer = m.game.mapRaw.layers[i],
				layerData = layer.data || layer.objects,
				layerProperties = layer.properties || {},
				pos = x + (y * m.game.mapRaw.width)
			if (layerData && layerProperties.collide && layerData[pos] > 0) return true
		}

		//True means it will collide, and is therfore an illegal move
		return false
	}

	// m.offset = 0
	// m.offset2 = 0
	// setInterval(function () {
	// 	m.offset++
	// 	m.offset2++
	// 	if (m.offset > 100) m.offset = 0
	// 	if (m.offset2 > 80) m.offset2 = 0
	// }, 10)
	m.revealMap = function (x, y) {

		var viewportWidth = m.toTile(m.game.width),
			viewportHeight = m.toTile(m.game.height),
			viewportHeightHalf = m.toTile(m.game.width/2),
			viewportWidthHalf = m.toTile(m.game.width/2),
			X = m.toTile(m.fromTile(m.game.player.x)),
			Y = m.toTile(m.fromTile(m.game.player.y)),
			toY = Y + (viewportHeightHalf + 10),
			fromY =  Y - (viewportHeightHalf + 10),
			toX = X + (viewportWidthHalf + 10),
			fromX =  X - (viewportWidthHalf + 10),
			tileX,
			tileY,
			testX,
			textY,
			layer,
			layerData,
			i,
			l
			

		for (l in m.game.map.layers) {
			
			layer = m.game.map.layers[l],
			layerData = layer.data || layer.objects || layer.children
				
			for (i = 0; i < layerData.length; i++) {
				tileX = m.toTile(layerData[i].x),
				tileY = m.toTile(layerData[i].y)


				testX = tileX > fromX && tileX < toX,
				testY = tileY > fromY && tileY < toY

				if (layerData[i]) {

					
					if ( testX && testY) {
						layerData[i].visible = true
						//layerData[i].alpha = 1
					}
					else {
						layerData[i].visible = false
						//layerData[i].alpha = 0
					}
				}
			}
		}

	}

	m.movePlayer = function () {
		var pos = {
				x: m.game.player._X,
				y: m.game.player._Y
			},
			distX = m.game.player.x - m.game.player._X,
			distY = m.game.player.y - m.game.player._Y
			
		
		if (Math.abs(distX) > m.game.tail || Math.abs(distY) > m.game.tail) {
			return
		}

		if (m.game.cameraLockedToPlayer) {
			if (m.getKey("LEFT") || m.getKey("A") ) {
				pos.x--
				m.game.player.direction = 'left'
			}
			
			else if (m.getKey("RIGHT") || m.getKey("D") ) {
				pos.x++
				m.game.player.direction = 'right'
			}
			
			else if (m.getKey("UP") || m.getKey("W") ) {
				pos.y--
				m.game.player.direction = 'up'
			}
			
			else if (m.getKey("DOWN") || m.getKey("S") ) {
				pos.y++
				m.game.player.direction = 'down'
			}

			if (!m.checkCollison(pos.x, pos.y) && pos.x >= 0 && pos.y >= 0 && pos.x < m.game.mapRaw.width && pos.y < m.game.mapRaw.height) {
				m.game.player._X = pos.x
				m.game.player._Y = pos.y
			}
		}
	}

	m.getObject = function () {
		if (!m.game.cameraLockedToPlayer || m.mapSwitching) return false
		for (var i in m.game.map.objects.children) {
			var obj = m.game.map.objects.children[i]
			if (obj.properties && obj.properties.doorway && (m.toTile(obj.x)) == m.game.player._X && (m.toTile(obj.y)) == m.game.player._Y ) {
				var doorway = obj.properties.doorway
				
				m.mapSwitching = true
				m.$applyAsync()
				setTimeout(function () {
					m.switchMap(doorway, obj, false, function () {})
				}, m.game.blackScreenFadeTime)
			}
		}
	}

})

/*Turns off the ng-scope, et al. debug classes*/
.config(['$compileProvider', function ($compileProvider) {
	$compileProvider.debugInfoEnabled(false);
}])


/*Directives*/
.directive('touch', function () {
	return function (scope, element, attrs) {
		element.bind('pointerdown', function () {
			try {
				scope.$apply(attrs.touch)
			} catch (e) {
				if (typeof console !== "object") console.log(e)
			}
		})
	}
})

