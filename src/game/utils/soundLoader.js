const soundLoader = (scene, soundArr) => {

  // for (let el of soundArr) {
  //   const filePath = `assets/sound/slumlord_sonata/${el}.mp3`
  //   scene.load.audio(el, filePath)
  // }

  scene.load.audio("gunshot_1", "assets/sound/weapons/gunshot_1.mp3")
  scene.load.audio("particle_rifle_shot", "assets/sound/weapons/particle_rifle_shot.mp3")
  scene.load.audio("reload_1", "assets/sound/weapons/handgun_reload_1.mp3")
  scene.load.audio("empty_gun_1", "assets/sound/weapons/empty_gun.mp3")
  scene.load.audio("pipe_impact_1", "assets/sound/weapons/pipe_impact.mp3")
  scene.load.audio("death_grunt_1", "assets/sound/death/death_grunt.mp3")
  scene.load.audio("hero_death", "assets/sound/death/hero_death.mp3")
  scene.load.audio("power_boost_1", "assets/sound/vehicles/power_boost.mp3")
  scene.load.audio("tire_screech_1", "assets/sound/vehicles/tire_screech.mp3")
  scene.load.audio("bike_thud", "assets/sound/vehicles/bike_thud.mp3")
  scene.load.audio("dash", "assets/sound/vehicles/dash.mp3")
  scene.load.audio("explosion_1", "assets/sound/weapons/explosion_1.mp3")
  scene.load.audio("bullet_hit_1", "assets/sound/weapons/bullet_hit.mp3")
  scene.load.audio("bullet_impact_concrete_1", "assets/sound/weapons/bullet_impact_environment.mp3")
  scene.load.audio("health_collect", "assets/sound/effects/health_collect.mp3")
  scene.load.audio("melee_swing", "assets/sound/weapons/melee_swing.mp3")


}

export const soundCreator = (scene, soundArr) => {
  scene.soundObj.powerBoost1 = scene.sound.add("power_boost_1", {
    loop: true,
    volume: 0.3 
  });
  scene.soundObj.gunshot1 = scene.sound.add("gunshot_1", {volume: 0.3});
  scene.soundObj.particleRifleShot = scene.sound.add("particle_rifle_shot", {volume: 0.4});
  scene.soundObj.reload1 = scene.sound.add("reload_1", {volume: 0.2});
  scene.soundObj.emptyGun1 = scene.sound.add("empty_gun_1", {volume: 0.3});
  scene.soundObj.pipeImpact1 = scene.sound.add("pipe_impact_1", {volume: 0.5});
  scene.soundObj.deathGrunt1 = scene.sound.add("death_grunt_1", {volume: 0.8});
  scene.soundObj.heroDeath = scene.sound.add("hero_death", {volume: 0.8});
  scene.soundObj.tireScreech1 = scene.sound.add("tire_screech_1", {volume: 0.2});
  scene.soundObj.bikeThud1 = scene.sound.add("bike_thud", {volume: 0.5});
  scene.soundObj.explosion1 = scene.sound.add("explosion_1", {volume: 0.8});
  scene.soundObj.bulletHit1 = scene.sound.add("bullet_hit_1", {volume: 0.4});
  scene.soundObj.bulletImpactEnv1 = scene.sound.add("bullet_impact_concrete_1", {volume: 0.5});
  scene.soundObj.dash = scene.sound.add("dash", {volume: 0.5});
  scene.soundObj.healthCollect = scene.sound.add("health_collect", {volume: 0.5});
  scene.soundObj.meleeSwing1 = scene.sound.add("melee_swing", {volume: 0.5});
  

}

export default soundLoader
