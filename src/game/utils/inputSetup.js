export const inputSetup = (scene) => {
    scene.keys = scene.input.keyboard.addKeys(
        "W,A,S,D,CTRL,SHIFT,SPACE,E,ESC,R,1,2,3",
        true
      )
}

// for setting deadzone of controller
// function setDeadzone(x, y, deadzone) {
//     // console.log(x, y)
//     let m = Math.sqrt(x * x + y * y)

//     if (m < deadzone) return [0, 0]

//     let over = m - deadzone // 0 -> 1 - deadzone
//     let nover = over / (1 - deadzone) // 0 -> 1

//     let nx = x / m
//     let ny = y / m

//     return [nx * nover, ny * nover]
// }

export const inputCheck = (scene) => {
    scene.downMove = scene.keys.S.isDown
    scene.upMove = scene.keys.W.isDown
    scene.leftMove = scene.keys.A.isDown
    scene.rightMove = scene.keys.D.isDown
    return scene.keys;
}