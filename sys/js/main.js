

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
		['players-overworld', 'players-overworld.json']
		//['trainers-overworld', 'trainers-overworld.json'] //This is an old version, and not useful... but still...
	]

	m.game = {
		width: 640,
		height: 480,
		tileSize: 32,
		x: 0,
		y: 0,
		speed: 5,
		player: {
			x: 0,
			y: 0,
			_X: 0,
			_Y: 0,
			sprites: {}
		},
		tail: 0.1
	}

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
	        frames.push(PIXI.Texture.fromFrame(i));
	    }

	    var anim = new PIXI.extras.AnimatedSprite(frames);

	    for (var i in opts) {
	    	anim[i] = opts[i]
		}

	    if (pixiStage) pixiStage.addChild(anim);

	    return anim
	}

	m.init = function () {

		m.renderer = new PIXI.autoDetectRenderer(m.game.width, m.game.height)
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
		return Math.round(n / tileSize)
	}

	m.fromTile = function (n, tileSize) {
		tileSize = tileSize || m.game.tileSize
		return Math.round((n * tileSize) / tileSize)  * tileSize
	}

	m.loadMap = function (filename, callback) {
		$.getJSON('sys/maps/' + filename + '.json').success(function(data) {
			m.game.playing = true
			m.game.mapRaw = data
			m.game.map = {
				layers: {},
				objects: new PIXI.Container()
			}



			for (var layer in data.layers) {
				if (data.layers[layer].type != 'objectgroup') {

					var md = new PIXI.Container()
					for (var x in data.layers[layer].data) {
						var sprite = new PIXI.Sprite (m.res.pkmnTilesX2.textures['tiles_' + (data.layers[layer].data[x] - 1) + '.png'])
						sprite.position.x = (x % data.layers[layer].width) * m.game.tileSize
						sprite.position.y = (x / data.layers[layer].width).toFixed(0) * m.game.tileSize
						md.addChild(sprite)
					}

					m.game.map.layers[data.layers[layer].name] = md
					m.stages.main.addChild(md)

				}
				else {

					for (var i in data.layers[layer].objects) {
						var o = data.layers[layer].objects[i]

						//Add the player
						if (o.properties && o.properties.isPlayer) {
							//m.game.player.sprites.up = m.createAnimatedClip()
							m.game.player._X = m.toTile(o.x)
							m.game.player._Y = m.toTile(o.y) - 1
						}

						//Other objects
						else {
							var sprite = new PIXI.Sprite (m.res.pkmnTilesX2.textures['tiles_' + (o.gid - 1) + '.png'])
							sprite.position.x = m.fromTile(m.toTile(o.x))
							sprite.position.y = m.fromTile(m.toTile(o.y)) - m.game.tileSize
							m.game.map.objects.addChild(sprite)
						}
					}
				}
			}

			m.stages.main.addChild(m.game.map.objects)

			if (callback) callback()

		})
	}

	m.loop = function () {
		var ms = new Date().getTime()

		if (m._ts) {
			m.dt = (ms - m._ts) * 0.001
		}

		m._ts = ms


		if (m.game.playing) {
			//m._walking = !(Math.abs(m.stages.main.position.x - -(m.game.player.x * m.game.tileSize)) < 20)
			//m._walking = m._walking || !(Math.abs(m.stages.main.position.y - -(m.game.player.y * m.game.tileSize)) < 20)
			m._walking = false

			m.movePlayer()
			
			m.moveCamera()

			m.renderer.render(m.stages.main)
		}
		requestAnimationFrame(m.loop)
	}

	m.moveCamera = function () {

		var distX = m.game.player.x - m.game.player._X,
			distY = m.game.player.y - m.game.player._Y

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

		m.stages.main.position.x = -((m.game.player.x * m.game.tileSize)) + m.game.width / 2
		m.stages.main.position.y = -((m.game.player.y * m.game.tileSize)) + m.game.height / 2

	}

	m.checkCollison = function (x, y) {
		//True means it will collide, and is therfore an illegal move
		return false
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

		if (m.getKey("LEFT") || m.getKey("A") ) {
			pos.x--
		}
		
		if (m.getKey("RIGHT") || m.getKey("D") ) {
			pos.x++
		}
		
		if (m.getKey("UP") || m.getKey("W") ) {
			pos.y--
		}
		
		if (m.getKey("DOWN") || m.getKey("S") ) {
			pos.y++
		}

		if (!m.checkCollison(pos) && pos.x > 0 && pos.y > 0 && pos.x < m.game.mapRaw.width && pos.y < m.game.mapRaw.height) {
			m.game.player._X = pos.x
			m.game.player._Y = pos.y
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

