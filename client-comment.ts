// THREE (Three.js) および CANNON (Cannon-es) のインポート
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './utils/cannonDebugRenderer'

// 新しいThree.jsのシーンを作成
const scene = new THREE.Scene()

// ディレクショナルライト(指向性のある光源)を作成し、シーンに配置
const light = new THREE.DirectionalLight()
light.position.set(25, 50, 25)
light.castShadow = true // 影の描画を許可
light.shadow.mapSize.width = 16384 // 影のマップサイズを設定
light.shadow.mapSize.height = 16384
light.shadow.camera.near = 0.5 // 影のカメラの最小レンダリング距離
light.shadow.camera.far = 100 // 影のカメラの最大レンダリング距離
light.shadow.camera.top = 100
light.shadow.camera.bottom = -100
light.shadow.camera.left = -100
light.shadow.camera.right = 100
scene.add(light) // シーンにライトを追加

// ライトの影を描画するためのカメラのヘルパーを作成し、シーンに追加
const helper = new THREE.CameraHelper(light.shadow.camera)
scene.add(helper)

// パースペクティブカメラ(遠近法を持つカメラ)を作成
const camera = new THREE.PerspectiveCamera(
    75, // 視野角
    window.innerWidth / window.innerHeight, // アスペクト比
    0.1, // ニアクリップ
    1000 // ファークリップ
)

// 追尾カメラとそのピボットを作成し、シーンに追加
const chaseCam = new THREE.Object3D()
chaseCam.position.set(0, 0, 0)
const chaseCamPivot = new THREE.Object3D()
chaseCamPivot.position.set(0, 2, 4)
chaseCam.add(chaseCamPivot)
scene.add(chaseCam)

// WebGLレンダラーを作成し、シャドウマップを有効にし、DOMに追加
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap // シャドウマップのタイプを設定
document.body.appendChild(renderer.domElement) // レンダラーをDOMに追加

// フォンマテリアル（光の反射特性を持つマテリアル）を作成
const phongMaterial = new THREE.MeshPhongMaterial()

// 新しいCannon-esの物理シミュレーションの世界を作成
const world = new CANNON.World()
// Cannon.jsの世界では、物理法則（重力など）を定義できます。
// これが物体がどのように動くかを決定します。
// 世界の重力を設定。地球の重力加速度は約9.82m/s^2なので、それをシミュレートします
world.gravity.set(0, -9.82, 0)

// 地面のマテリアルを作成し、摩擦力と反発力を設定
const groundMaterial = new CANNON.Material('groundMaterial')
groundMaterial.friction = 0.25
groundMaterial.restitution = 0.25

// 車輪のマテリアルを作成し、摩擦力と反発力を設定
const wheelMaterial = new CANNON.Material('wheelMaterial')
wheelMaterial.friction = 0.25
wheelMaterial.restitution = 0.25

// 地面のオブジェクトを作成
const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(100, 100) // 地面のジオメトリ(形状)を作成
const groundMesh: THREE.Mesh = new THREE.Mesh(groundGeometry, phongMaterial) // ジオメトリとマテリアルからメッシュを作成
groundMesh.rotateX(-Math.PI / 2) // メッシュをX軸周りに90度回転
groundMesh.receiveShadow = true // 地面に影を落とすように設定
scene.add(groundMesh) // シーンに地面を追加

// 地面の物理ボディを作成し、物理シミュレーションの世界に追加
const groundShape = new CANNON.Box(new CANNON.Vec3(50, 1, 50)) // 地面の形状を作成
const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial }) // 形状とマテリアルからボディを作成
groundBody.addShape(groundShape) // ボディに形状を追加
groundBody.position.set(0, -1, 0) // ボディの位置を設定
world.addBody(groundBody) // 世界にボディを追加

// ジャンプ台を作成
for (let i = 0; i < 100; i++) {
    const jump = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 1, 0.5, 5), // ジャンプ台のジオメトリ(円錐形状)を作成
        phongMaterial // フォンマテリアルを使用
    )
    jump.position.x = Math.random() * 100 - 50 // x座標をランダムに設定
    jump.position.y = 0.5 // y座標を設定
    jump.position.z = Math.random() * 100 - 50 // z座標をランダムに設定
    scene.add(jump) // シーンにジャンプ台を追加

    // ジャンプ台の物理ボディを作成し、物理シミュレーションの世界に追加
    const cylinderShape = new CANNON.Cylinder(0.01, 1, 0.5, 5) // ジャンプ台の形状を作成
    const cylinderBody = new CANNON.Body({ mass: 0 }) // ジャンプ台のボディを作成（質量は0＝動かない）
    cylinderBody.addShape(cylinderShape, new CANNON.Vec3()) // ボディに形状を追加
    cylinderBody.position.x = jump.position.x // ボディのx座標を設定
    cylinderBody.position.y = jump.position.y // ボディのy座標を設定
    cylinderBody.position.z = jump.position.z // ボディのz座標を設定
    world.addBody(cylinderBody) // 世界にボディを追加
}

// ジャンプ台の作成
for (let i = 0; i < 100; i++) {
    // ジャンプ台のメッシュを作成
    const jump = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 1, 0.5, 5), // 円錐形状のジオメトリ
        phongMaterial // フォンシェーディングマテリアル
    )
    // ジャンプ台の位置をランダムに設定
    jump.position.x = Math.random() * 100 - 50
    jump.position.y = 0.5
    jump.position.z = Math.random() * 100 - 50
    scene.add(jump) // ジャンプ台をシーンに追加

    // ジャンプ台の物理ボディを作成
    const cylinderShape = new CANNON.Cylinder(0.01, 1, 0.5, 5) // 円柱形状の物理ボディ
    const cylinderBody = new CANNON.Body({ mass: 0 }) // 質量が0（固定オブジェクト）の物理ボディ
    cylinderBody.addShape(cylinderShape, new CANNON.Vec3()) // 形状を物理ボディに追加
    // 物理ボディの位置をメッシュの位置に合わせる
    cylinderBody.position.x = jump.position.x
    cylinderBody.position.y = jump.position.y
    cylinderBody.position.z = jump.position.z
    world.addBody(cylinderBody) // 物理ボディを物理シミュレーションの世界に追加
}

// 車体のメッシュを作成
const carBodyGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 2) // ボックス形状のジオメトリ
const carBodyMesh: THREE.Mesh = new THREE.Mesh(carBodyGeometry, phongMaterial) // ジオメトリとマテリアルからメッシュを作成
carBodyMesh.position.y = 3 // 車体の高さを設定
carBodyMesh.castShadow = true // 車体から影を投影するように設定
scene.add(carBodyMesh) // 車体をシーンに追加
carBodyMesh.add(chaseCam) // 車体に追従カメラを追加

// 車体の物理ボディを作成
const carBodyShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1)) // ボックス形状の物理ボディ
const carBody = new CANNON.Body({ mass: 1 }) // 質量が1の物理ボディ
carBody.addShape(carBodyShape) // 形状を物理ボディに追加
// 物理ボディの位置をメッシュの位置に合わせる
carBody.position.x = carBodyMesh.position.x
carBody.position.y = carBodyMesh.position.y
carBody.position.z = carBodyMesh.position.z
world.addBody(carBody) // 物理ボディを物理シミュレーションの世界に追加

// 前左の車輪
const wheelLFGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(
    0.33,
    0.33,
    0.2 // 円柱形状のジオメトリ（車輪の形状）
)
wheelLFGeometry.rotateZ(Math.PI / 2) // 車輪を垂直に回転
const wheelLFMesh: THREE.Mesh = new THREE.Mesh(wheelLFGeometry, phongMaterial) // メッシュ（表示オブジェクト）を作成
// 車輪の位置を設定
wheelLFMesh.position.x = -1
wheelLFMesh.position.y = 3
wheelLFMesh.position.z = -1
wheelLFMesh.castShadow = true // 車輪から影を投影するように設定
scene.add(wheelLFMesh) // 車輪をシーンに追加

const wheelLFShape = new CANNON.Sphere(0.33) // 車輪の物理ボディの形状（球）を作成
const wheelLFBody = new CANNON.Body({ mass: 1, material: wheelMaterial }) // 車輪の物理ボディを作成（質量は1）
wheelLFBody.addShape(wheelLFShape) // 形状を物理ボディに追加
// 物理ボディの位置をメッシュの位置に合わせる
wheelLFBody.position.x = wheelLFMesh.position.x
wheelLFBody.position.y = wheelLFMesh.position.y
wheelLFBody.position.z = wheelLFMesh.position.z
world.addBody(wheelLFBody) // 物理ボディを物理シミュレーションの世界に追加

// 前右の車輪
const wheelRFGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(
    0.33,
    0.33,
    0.2 // 円柱形状のジオメトリ（車輪の形状）
)
wheelRFGeometry.rotateZ(Math.PI / 2) // 車輪を垂直に回転
const wheelRFMesh: THREE.Mesh = new THREE.Mesh(wheelRFGeometry, phongMaterial) // メッシュ（表示オブジェクト）を作成
// 車輪の位置を設定
wheelRFMesh.position.y = 3
wheelRFMesh.position.x = 1
wheelRFMesh.position.z = -1
wheelRFMesh.castShadow = true // 車輪から影を投影するように設定
scene.add(wheelRFMesh) // 車輪をシーンに追加

const wheelRFShape = new CANNON.Sphere(0.33) // 車輪の物理ボディの形状（球）を作成
const wheelRFBody = new CANNON.Body({ mass: 1, material: wheelMaterial }) // 車輪の物理ボディを作成（質量は1）
wheelRFBody.addShape(wheelRFShape) // 形状を物理ボディに追加
// 物理ボディの位置をメッシュの位置に合わせる
wheelRFBody.position.x = wheelRFMesh.position.x
wheelRFBody.position.y = wheelRFMesh.position.y
wheelRFBody.position.z = wheelRFMesh.position.z
world.addBody(wheelRFBody) // 物理ボディを物理シミュレーションの世界に追加

//back left wheel
const wheelLBGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(
    0.4,
    0.4,
    0.33
)
wheelLBGeometry.rotateZ(Math.PI / 2) // GeometryをZ軸を中心に90度回転させます
const wheelLBMesh: THREE.Mesh = new THREE.Mesh(wheelLBGeometry, phongMaterial) // メッシュを作成します
wheelLBMesh.position.y = 3 // 車輪のy座標を設定します
wheelLBMesh.position.x = -1 // 車輪のx座標を設定します
wheelLBMesh.position.z = 1 // 車輪のz座標を設定します
wheelLBMesh.castShadow = true // 影を投射するように設定します
scene.add(wheelLBMesh) // メッシュをシーンに追加します
const wheelLBShape = new CANNON.Sphere(0.4) // Cannon-esで使用する車輪の形状を作成します
const wheelLBBody = new CANNON.Body({ mass: 1, material: wheelMaterial }) // 車輪の物理ボディを作成します
wheelLBBody.addShape(wheelLBShape) // 形状を物理ボディに追加します
// メッシュの位置を物理ボディの位置に合わせます
wheelLBBody.position.x = wheelLBMesh.position.x
wheelLBBody.position.y = wheelLBMesh.position.y
wheelLBBody.position.z = wheelLBMesh.position.z
world.addBody(wheelLBBody) // 物理ボディを物理シミュレーションの世界に追加します

//back right wheel
// 以下の処理は上記の左後輪と同じですが、x座標が異なります
const wheelRBGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(
    0.4,
    0.4,
    0.33
)
wheelRBGeometry.rotateZ(Math.PI / 2)
const wheelRBMesh: THREE.Mesh = new THREE.Mesh(wheelRBGeometry, phongMaterial)
wheelRBMesh.position.y = 3
wheelRBMesh.position.x = 1
wheelRBMesh.position.z = 1
wheelRBMesh.castShadow = true
scene.add(wheelRBMesh)
const wheelRBShape = new CANNON.Sphere(0.4)
const wheelRBBody = new CANNON.Body({ mass: 1, material: wheelMaterial })
wheelRBBody.addShape(wheelRBShape)
wheelRBBody.position.x = wheelRBMesh.position.x
wheelRBBody.position.y = wheelRBMesh.position.y
wheelRBBody.position.z = wheelRBMesh.position.z
world.addBody(wheelRBBody)

// それぞれの車輪の軸を定義します。ここではすべての車輪がX軸に沿って回転します
const leftFrontAxis = new CANNON.Vec3(1, 0, 0)
const rightFrontAxis = new CANNON.Vec3(1, 0, 0) // 右前輪の軸を定義します（X軸に沿って回転）
const leftBackAxis = new CANNON.Vec3(1, 0, 0) // 左後輪の軸を定義します（X軸に沿って回転）
const rightBackAxis = new CANNON.Vec3(1, 0, 0) // 右後輪の軸を定義します（X軸に沿って回転）

// ヒンジ制約を作成して車輪を車体に取り付けます
const frontLeftHinge = new CANNON.HingeConstraint(
    carBody,
    wheelLFBody,
    {
        pivotA: new CANNON.Vec3(-1, 0, -1),
        axisA: leftFrontAxis,
        pivotB: new CANNON.Vec3(),
        axisB: leftFrontAxis,
    }
)

const frontRightHinge = new CANNON.HingeConstraint(
    carBody,
    wheelRFBody,
    {
        pivotA: new CANNON.Vec3(1, 0, -1),
        axisA: rightFrontAxis,
        pivotB: new CANNON.Vec3(),
        axisB: rightFrontAxis,
    }
)

const backLeftHinge = new CANNON.HingeConstraint(
    carBody,
    wheelLBBody,
    {
        pivotA: new CANNON.Vec3(-1, 0, 1),
        axisA: leftBackAxis,
        pivotB: new CANNON.Vec3(),
        axisB: leftBackAxis,
    }
)

const backRightHinge = new CANNON.HingeConstraint(
    carBody,
    wheelRBBody,
    {
        pivotA: new CANNON.Vec3(1, 0, 1),
        axisA: rightBackAxis,
        pivotB: new CANNON.Vec3(),
        axisB: rightBackAxis,
    }
)

world.addConstraint(frontLeftHinge)
world.addConstraint(frontRightHinge)
world.addConstraint(backLeftHinge)
world.addConstraint(backRightHinge)

// 前輪のヒンジ制約を作成し、物理世界に追加
const constraintLF = new CANNON.HingeConstraint(carBody, wheelLFBody, {
    pivotA: new CANNON.Vec3(-1, -0.5, -1),
    axisA: leftFrontAxis,
    maxForce: 0.99,
})
world.addConstraint(constraintLF)

const constraintRF = new CANNON.HingeConstraint(carBody, wheelRFBody, {
    pivotA: new CANNON.Vec3(1, -0.5, -1),
    axisA: rightFrontAxis,
    maxForce: 0.99,
})
world.addConstraint(constraintRF)

// 後輪のヒンジ制約を作成し、物理世界に追加
const constraintLB = new CANNON.HingeConstraint(carBody, wheelLBBody, {
    pivotA: new CANNON.Vec3(-1, -0.5, 1),
    axisA: leftBackAxis,
    maxForce: 0.99,
})
world.addConstraint(constraintLB)

const constraintRB = new CANNON.HingeConstraint(carBody, wheelRBBody, {
    pivotA: new CANNON.Vec3(1, -0.5, 1),
    axisA: rightBackAxis,
    maxForce: 0.99,
})
world.addConstraint(constraintRB)

// 後輪駆動を有効化
constraintLB.enableMotor()
constraintRB.enableMotor()

// キーボードイベントを監視するためのオブジェクト
const keyMap: { [id: string]: boolean } = {}
const onDocumentKey = (e: KeyboardEvent) => {
    keyMap[e.code] = e.type === 'keydown' // キーが押されたらtrue、離されたらfalseを設定
}

let forwardVelocity = 0
let rightVelocity = 0

// キーボードイベントリスナーを追加
document.addEventListener('keydown', onDocumentKey, false)
document.addEventListener('keyup', onDocumentKey, false)

// ウィンドウサイズが変更されたときにカメラとレンダラーを更新
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight // アスペクト比を更新
    camera.updateProjectionMatrix() // プロジェクション行列を更新
    renderer.setSize(window.innerWidth, window.innerHeight) // レンダラーのサイズを更新
    render() // シーンを再描画
}

// Stats.jsはパフォーマンスを視覚化するためのJavaScriptライブラリです
// 新しいStatsインスタンスを作成し、そのDOM要素をbodyに追加します
const stats = new Stats()
document.body.appendChild(stats.dom)

// dat.GUIはユーザーインターフェースを作成するためのJavaScriptライブラリです
// 新しいGUIインスタンスを作成し、'Physics'という名前のフォルダを追加します
const gui = new GUI()
const physicsFolder = gui.addFolder('Physics')

// 物理エンジンの重力設定をGUIに追加します
// x, y, zの各軸に対して-10.0から10.0までの範囲で設定できます
physicsFolder.add(world.gravity, 'x', -10.0, 10.0, 0.1)
physicsFolder.add(world.gravity, 'y', -10.0, 10.0, 0.1)
physicsFolder.add(world.gravity, 'z', -10.0, 10.0, 0.1)

// フォルダをデフォルトで開いた状態にします
physicsFolder.open()

// THREE.Clockは時間を管理するためのオブジェクトです
// 新しいClockインスタンスを作成します
const clock = new THREE.Clock()

// deltaは前のフレームからの経過時間を保存する変数です
let delta

// CannonDebugRendererはCannon.jsのデバッグ表示をThree.jsで行うためのツールです
// 新しいCannonDebugRendererインスタンスを作成し、シーンと物理世界を渡します
const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

// THREE.Vector3は3D空間内の点またはベクトルを表現します
// 新しいVector3インスタンスを作成します
const v = new THREE.Vector3()

// thrustingは推進力を表すフラグです
// 初期値はfalseで、推進力がない状態を示します
let thrusting = false

// アニメーションループを定義します
function animate() {
    // requestAnimationFrameを使用して、ブラウザのリフレッシュレートに合わせてanimate関数を再帰的に呼び出します
    requestAnimationFrame(animate)

    // helperのupdateメソッドを呼び出します（helperが何をするオブジェクトかはコードからはわかりません）
    helper.update()

    // 前のフレームからの経過時間を取得し、それを物理エンジンの時間ステップに使用します
    delta = Math.min(clock.getDelta(), 0.1)
    world.step(delta)

    // Cannon.jsのデバッグレンダラーを更新します
    cannonDebugRenderer.update()

    // Cannon.jsのオブジェクトからThree.jsのオブジェクトへ座標をコピーします
    // これにより、物理シミュレーションによる変更が視覚的に反映されます
    // 以下のブロックでは、車の本体と各輪の位置と回転を更新しています
    // Copy coordinates from Cannon to Three.js
    carBodyMesh.position.set(
        carBody.position.x,
        carBody.position.y,
        carBody.position.z
    )
    carBodyMesh.quaternion.set(
        carBody.quaternion.x,
        carBody.quaternion.y,
        carBody.quaternion.z,
        carBody.quaternion.w
    )

    wheelLFMesh.position.set(
        wheelLFBody.position.x,
        wheelLFBody.position.y,
        wheelLFBody.position.z
    )
    wheelLFMesh.quaternion.set(
        wheelLFBody.quaternion.x,
        wheelLFBody.quaternion.y,
        wheelLFBody.quaternion.z,
        wheelLFBody.quaternion.w
    )

    wheelRFMesh.position.set(
        wheelRFBody.position.x,
        wheelRFBody.position.y,
        wheelRFBody.position.z
    )
    wheelRFMesh.quaternion.set(
        wheelRFBody.quaternion.x,
        wheelRFBody.quaternion.y,
        wheelRFBody.quaternion.z,
        wheelRFBody.quaternion.w
    )

    wheelLBMesh.position.set(
        wheelLBBody.position.x,
        wheelLBBody.position.y,
        wheelLBBody.position.z
    )
    wheelLBMesh.quaternion.set(
        wheelLBBody.quaternion.x,
        wheelLBBody.quaternion.y,
        wheelLBBody.quaternion.z,
        wheelLBBody.quaternion.w
    )

    wheelRBMesh.position.set(
        wheelRBBody.position.x,
        wheelRBBody.position.y,
        wheelRBBody.position.z
    )
    wheelRBMesh.quaternion.set(
        wheelRBBody.quaternion.x,
        wheelRBBody.quaternion.y,
        wheelRBBody.quaternion.z,
        wheelRBBody.quaternion.w
    )

    // thrustingは、車が前進または後退しているかどうかを示すブール値です
    thrusting = false

    // キーボードの入力に基づいて車の動きを制御します
    // KeyWまたはArrowUpキーが押されている場合、前進速度を増やし、thrustingをtrueに設定します
    if (keyMap['KeyW'] || keyMap['ArrowUp']) {
        if (forwardVelocity < 100.0) forwardVelocity += 1
        thrusting = true
    }

    // KeySまたはArrowDownキーが押されている場合、前進速度を減らし、thrustingをtrueに設定します
    if (keyMap['KeyS'] || keyMap['ArrowDown']) {
        if (forwardVelocity > -100.0) forwardVelocity -= 1
        thrusting = true
    }

    // 'KeyA'か'ArrowLeft'が押されている場合、右方向の速度を減らします
    if (keyMap['KeyA'] || keyMap['ArrowLeft']) {
        if (rightVelocity > -1.0) rightVelocity -= 0.1
    }

    // 'KeyD'か'ArrowRight'が押されている場合、右方向の速度を増やします
    if (keyMap['KeyD'] || keyMap['ArrowRight']) {
        if (rightVelocity < 1.0) rightVelocity += 0.1
    }

    // Spaceキーが押されている場合、前進速度を0に近づけます（ブレーキ操作）
    if (keyMap['Space']) {
        if (forwardVelocity > 0) {
            forwardVelocity -= 1
        }
        if (forwardVelocity < 0) {
            forwardVelocity += 1
        }
    }

    // thrustingがfalseの場合（つまり、前進または後退していない場合）、
    // 前進速度を徐々に減速させます
    if (!thrusting) {
        //not going forward or backwards so gradually slow down
        if (forwardVelocity > 0) {
            forwardVelocity -= 0.25
        }
        if (forwardVelocity < 0) {
            forwardVelocity += 0.25
        }
    }

    // モーターの速度を設定し、車の回転を制御します
    constraintLB.setMotorSpeed(forwardVelocity)
    constraintRB.setMotorSpeed(forwardVelocity)
    constraintLF.axisA.z = rightVelocity
    constraintRF.axisA.z = rightVelocity

    // カメラが車を見続けるようにします
    camera.lookAt(carBodyMesh.position)

    // 追尾カメラの位置を取得し、カメラの位置をそれに近づけます
    chaseCamPivot.getWorldPosition(v)
    if (v.y < 1) {
        v.y = 1
    }
    camera.position.lerpVectors(camera.position, v, 0.05)

    // レンダラーを更新します
    render()

    // パフォーマンス統計を更新します
    stats.update()
}

// レンダリングのための関数を定義します
function render() {
    // rendererのrenderメソッドを使用してシーンをカメラからの視点でレンダリングします
    renderer.render(scene, camera)
}

// animate関数を初めて呼び出します。この関数は再帰的に自身を呼び出すので、
// これによりアニメーションループが始まります
animate()
