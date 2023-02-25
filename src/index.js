import * as BABYLON from 'babylonjs'
import textureSrc from './assets/flare.png'


/**
 * particlesSystem: move some sprites around place.
 * @param scene: BABYLON.Scene
 * @param W: number,
 * @param H: number,
 * @param Z: number,
 * @param N: number,
 */

const createParticles = ({
     scene,
     W = 100,
     H = 20,
     Z = 50,
     N = 15,
 }) => {
    const MAX_ALPHA = .45
    const MIN_SPD_ALPHA = .0025
    const MAX_SPD_RND_ALPHA =  0.005

    const MAX_SPD = 0.015
    const MAX_SPD_HALF = MAX_SPD / 2

    const centerPoint = [0, 0, 0]

    const particleSystem = new BABYLON.ParticleSystem("particles", N, scene)
    particleSystem.particleTexture = new BABYLON.Texture(textureSrc, scene)
    particleSystem.blendMode = BABYLON.BaseParticleSystem.BLENDMODE_ADD
    particleSystem.color1 = new BABYLON.Color4(0.8, 0.8, 0.7, 0)
    particleSystem.emitRate = 1000

    /** don't pure ..  ********************************/
    const resetSingleParticle = p => {
        p.color.a = 0
        p.userData = {
            spdX: Math.random() * MAX_SPD - MAX_SPD_HALF,
            spdY: Math.random() * MAX_SPD - MAX_SPD_HALF,
            spdZ: Math.random() * MAX_SPD - MAX_SPD_HALF,
            spdAlpha: Math.random() * MAX_SPD_RND_ALPHA + MIN_SPD_ALPHA,
            isMustStartHide: false,
            countIterations: Math.floor(Math.random() * 3 + 1)
        }
        p.position.x = Math.random() * W - W / 2 + centerPoint[0]
        p.position.y = Math.random() * H - H / 2 + centerPoint[1]
        p.position.z = Math.random() * Z - Z / 2 + centerPoint[2]
    }


    let isUpdate = true
    particleSystem.updateFunction = ps => {
        if (!isUpdate) {
            return
        }

        /** don't create new particles, use only exists */
        if (ps.length > N) {
            particleSystem.emitRate = 0
        }

        for (let i = 0; i < ps.length; ++i) {
            /** start init particle data ***************/
            if (!ps[i].userData) {
                resetSingleParticle(ps[i])
            }

            /** update position ************************/
            ps[i].position.x += ps[i].userData.spdX
            ps[i].position.y += ps[i].userData.spdY
            ps[i].position.z += ps[i].userData.spdZ

            /** update alpha and reset if life complete */
            if (!ps[i].userData.isMustStartHide) {
                ps[i].color.a += ps[i].userData.spdAlpha
                if (ps[i].color.a > MAX_ALPHA) {
                    ps[i].userData.isMustStartHide = true
                }
            }

            if (ps[i].userData.isMustStartHide) {
                ps[i].color.a -= ps[i].userData.spdAlpha

                if (ps[i].color.a <= 0) {
                    ps[i].userData.countIterations -= 1

                    if (ps[i].userData.countIterations > 0) {
                        ps[i].userData.isMustStartHide = false
                    } else {
                        resetSingleParticle(ps[i])
                    }
                }
            }
        }
    }

    particleSystem.start()

    return {
        stop: () => {
            isUpdate = false
        },
        start: () => {
            isUpdate = true
        },
        setCenterPos: (x, y, z) => {
            centerPoint[0] = x
            centerPoint[1] = y
            centerPoint[2] = z
        },
    }
}



/** HELPERS FOR DEMONSTRATE APP ***************************************************/
/** *******************************************************************************/
/** *******************************************************************************/
/** *******************************************************************************/



const createGround = root => {
    const { scene } = root.studio

    const mat = new BABYLON.StandardMaterial("Ground Material", scene)
    mat.diffuseColor = new BABYLON.Color3(0.5, .7, 0.2);

    const grounds = []

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene)
    ground.material = mat
    grounds.push(ground)
    for (let i = 0; i < 100; ++i) {
        for (let j = 0; j < 100; ++j) {
            const inst = ground.createInstance('ground_' + i + "_" + j)
            inst.position = new BABYLON.Vector3(i * 6.3, 0, j * 6.3);
            grounds.push(inst)
        }
    }

    return grounds
}


const createStudio = (canvas) => {
    const engine = new BABYLON.Engine(canvas, true)
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.7);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 0.7

    return {
        scene,
        engine,
        light,
    }
}


const createKeyboardListener = () => {

    let functionsToExec = []

    const keys = {
        'up': false,
        'down': false,
        'left': false,
        'right': false,
        'p': false,
    }

    const keysEnabled = {
        'up': true,
        'down': true,
        'left': true,
        'right': true,
    }


    const keyUpdate = function ( keyCode, isDown ) {
        switch( keyCode ) {
            case 38:
            case 87:
                keysEnabled['up'] && (keys['up'] = isDown)
                break;
            case 40:
            case 83:
                keysEnabled['down'] && (keys['down'] = isDown)
                break;
            case 37:
            case 65:
                keys['left'] = isDown
                break;
            case 39:
            case 68:
                keys['right'] = isDown
                break;
            case 79:
                keys['o'] = isDown
                break;
            case 80:
                keys['p'] = isDown
                break;
            default:
        }

        for (let i = 0; i < functionsToExec.length; ++i) {
            functionsToExec[i](keys)
        }
    }

    document.addEventListener('keydown', event => keyUpdate(event.keyCode, true))
    document.addEventListener('keyup', event => keyUpdate(event.keyCode, false))

    return {
        on: fn => {
            functionsToExec.push(fn)
            return () => {
                functionsToExec = functionsToExec.filter(f => f !== fn)
            }
        }
    }
}


const createPlayer = (root) => {
    const { studio } = root

    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), studio.scene)
    camera.rotation.y = Math.PI / 4
    let keyboard = null

    root.keyListener.on(k => {
        keyboard = k
    })

    const spd = 1

    return {
        position: camera.position,
        rotation: camera.rotation,
        update: () => {
            if (!keyboard) {
                return;
            }

            if (keyboard.left) {
                camera.rotation.y -= 0.03
            }

            if (keyboard.right) {
                camera.rotation.y += 0.03
            }

            if (keyboard.up) {
                camera.position.x += Math.sin(camera.rotation.y) * spd
                camera.position.z += Math.cos(camera.rotation.y) * spd
            }

            if (keyboard.down) {
                camera.position.x -= Math.sin(camera.rotation.y) * spd
                camera.position.z -= Math.cos(camera.rotation.y) * spd
            }
        }
    }
}


export const initApp = () => {
    const root = {}
    root.keyListener = createKeyboardListener()
    root.canvas = document.getElementById("renderCanvas")
    root.studio = createStudio(root.canvas)

    const resize = () => {
        root.canvas.style.width = '100vw'
        root.canvas.style.height = '100vh'
        root.studio.engine.resize()
    }
    window.addEventListener("resize", resize)
    resize()

    const grounds = createGround(root)
    const player = createPlayer(root)

    const particles = createParticles({
        scene: root.studio.scene,
        W: 100,
        Z: 100,
        H: 20,
        N: 50,
    })

    /** CHECK STOP ***********************************/
    /** setTimeout(() => { particles.stop() }, 5000) */

    root.studio.engine.runRenderLoop(() => {
        player.update()
        particles.setCenterPos(
            player.position.x + Math.sin(player.rotation.y) * 50,
            player.position.y,
            player.position.z + Math.cos(player.rotation.y) * 50
        )

        root.studio.scene.render()
    })
}

window.addEventListener('load', initApp)
