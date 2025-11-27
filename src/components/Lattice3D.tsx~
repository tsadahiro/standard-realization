import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from "@react-three/fiber";
import { Cylinder } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import {useMemo} from "react";
import * as THREE from "three";

export default function Lattice3D() {

  function CylinderBetween({ start, end, radius = 0.02 }:{start:number[], end:number[], radius:number}) {
    // start, end は [x,y,z] の配列想定
    const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVec = useMemo(() => new THREE.Vector3(...end), [end]);

    // 中点（シリンダーの位置）
    const mid = useMemo(() => startVec.clone().add(endVec).multiplyScalar(0.5), [startVec, endVec]);
    // ベクトルと長さ
    const dir = useMemo(() => endVec.clone().sub(startVec), [startVec, endVec]);
    const length = dir.length();

    // シリンダーを回転させるクォータニオン
    const orientation = useMemo(() => {
      const axis = new THREE.Vector3(0, 1, 0); // cylinder は Y軸に沿って立っている
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(axis, dir.clone().normalize());
      return quaternion;
    }, [dir]);

    return (
      <Cylinder
	args={[radius, radius, length, 16]} // 半径・高さ
	position={mid}
	quaternion={orientation}
      >
	<meshStandardMaterial color="orange" />
      </Cylinder>
    );
  }  

  function Atom({pos}:{pos:number[]}){
    const directions = [[-1/2,1/2,1/2],[1/2,-1/2,1/2],[1/2,1/2,-1/2],[-1/2,-1/2,-1/2]]
    const end = directions.map((dir)=>(dir.map((d,i)=>(d+pos[i]))));
    console.log(end);
    return (
      <>
	<mesh position={new THREE.Vector3(...pos)}>
	  <sphereGeometry args={[0.1, 32]} />
          <meshPhongMaterial />
	</mesh>
	<mesh >
	  {end.map((to)=><CylinderBetween start={pos} end={to} radius={0.02}/>)}
          <meshPhongMaterial />
	</mesh>
      </>
    )
  }
  function Atom1({pos}:{pos:number[]}){
    const directions = [[1/2,1/2,1/2],
			[-1/2,-1/2,1/2],
			[-1/2,1/2,-1/2],
			[1/2,-1/2,-1/2]]
    const end = directions.map((dir)=>(dir.map((d,i)=>(d+pos[i]))));
    console.log(end);
    return (
      <>
	<mesh position={new THREE.Vector3(...pos)}>
	  <sphereGeometry args={[0.1, 32]} />
          <meshPhongMaterial />
	</mesh>
	<mesh >
	  {end.map((to)=><CylinderBetween start={pos} end={to} radius={0.02}/>)}
          <meshPhongMaterial />
	</mesh>
      </>
    )
  }

  function Atoms(){
    const atoms = [];
    for (let x=-5; x<5; x++){
      for (let y=-5; y<5; y++){
        for (let z=-5; z<5; z++){
          if ((x+y+z)%2==0){
            atoms.push(<Atom1 pos={[x,y,z]}/>);
            atoms.push(<Atom pos={[x+1/2,y+1/2,z+1/2]}/>);            
          }
        }
      }
    }
    return atoms;
  }  

  return (
  <div style={{width:"200dvh",height:"100dvh"}}>
    <Canvas>
      <OrbitControls/>
      <PerspectiveCamera makeDefault  {...{ position: [0.4, 3.4, 10], fov: 25 }} />
      <Atoms/>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="blue" />
    </Canvas>
  </div>
  );
}
