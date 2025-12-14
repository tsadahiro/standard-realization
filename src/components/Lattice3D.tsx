import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from "@react-three/fiber";
import { Cylinder } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import {useMemo} from "react";
import * as THREE from "three";
import * as math from 'mathjs';
import { Matrix } from 'mathjs';

export default function Lattice3D({V, E}:any) {
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




  function incidentEdges(v:number,  E:number[][]){
    const inc = [];
    //console.log(v,E);
    //for (let i of E.keys()){
    for (let i =0; i < E.length; i++){
      if (v == E[i][0]){
	inc.push({idx:i, dir:1});
      }
      else if (v == E[i][1]){
	inc.push({idx:i, dir:-1});
      }
    }
    return inc;
  }

  function cyclesFrom(start:number, length:number, E:number[][]){
    const vpaths:any = []
    const epaths:any = []
    function visit(w:number, vpath:number[], epath:number[], l:number){
      //console.log(w,epath);
      if (l <= 0 && w == start){
	vpaths.push(vpath.slice());
	epaths.push(epath.slice());
	return;
      }
      else if (l <= 0){
	return;
      }

      //console.log(w,E);
      for (let e of incidentEdges(w,E)){
	//const n = (e.dir == 1 ? E[e.idx][1] : E[e.idx][0]);
	let n;
	if (e.dir == 1) {
      	  n = E[e.idx][1];
	}
	else {
      	  n = E[e.idx][0];
	}
	if (epath.map((el:any)=>el.idx).includes(e.idx)) {
      	  continue;
	}
	//if (vpath.includes(n) || start > n ) {
	//	continue;
	//}
	let newVpath:any = vpath.slice();
	newVpath.push(n);
	let newEpath:any = epath.slice();
	newEpath.push(e);
	visit(n, newVpath, newEpath, l-1);
      }
    }

    function coefvector(epath:any){
      const coef = Array(E.length);
      coef.fill(0);
      for (let edge of epath){
	coef[edge.idx]=edge.dir;
      }
      return coef;
    }
  
    visit(start,[],[],length);
    return(epaths.map((epath:any)=>coefvector(epath)));
  }


  function incidenceMatrix(V:number[], E:number[][]){
    console.log(V,E);
    const A = [];
    //console.log(cyclesFrom(0,3,E));
    //for (let length=2; length<=10; length++){
    for (let length=2; length<=E.length; length++){
    //for (let length=E.length-1; length>=2; length--){
    //for (let length = 6; length >= 2; length--){
      if (A.length >= E.length - V.length + 1 ){
	break;
      }
      for (let i = 0; i < V.length; i++){
	const newcycles = cyclesFrom(i,length,E);
	for (let c of newcycles){
	  const M=A.slice();
	  M.push(c);
	  const B = math.matrix(M);
	  if (Math.abs(math.det(math.multiply(B,math.transpose(B))))>0.01){
	    A.push(c);
	  }
	}
      }
    }
    return A;
  }

  // Sunada's topological crystallography pp.146 Summary 2
  function getA(V:number[], E:number[][]){
    console.log(V,E);
    const M = incidenceMatrix(V,E);
    return(math.multiply(M,math.transpose(M)));
  }


  // Sunada's topological crystallography pp.146 Summary 2
  function Gamma(V:number[], E:number[][]){

    const dim = 3;
    const A = getA(V,E);
    const b = A.length; // betch number
    const lowids = Array(b-dim); // for 3D

    for (let i=0; i<b-dim; i++){
      lowids[i]=i+dim;
    }

    if (b == dim){
      return(A);
    }

    const A11 = math.subset(A, math.index([0,1,2],[0,1,2]));
    const A12 = math.subset(A, math.index([0,1,2], lowids));
    const A21 = math.subset(A, math.index(lowids, [0,1,2]));
    const A22 = math.subset(A, math.index(lowids, lowids));
    const Gamma = math.subtract(A11, math.multiply(math.multiply(A12, math.inv(A22)),A21));
    return(Gamma);
  }

  function cholesky(A: number[][]): number[][] {
    const n = A.length;
    const L = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
	let sum = A[i][j];
	
	for (let k = 0; k < j; k++) {
          sum -= L[i][k] * L[j][k];
	}
	
	if (i === j) {
          if (sum <= 0) {
            throw new Error("Matrix is not positive definite");
          }
          L[i][j] = Math.sqrt(sum);
	} else {
          L[i][j] = sum / L[j][j];
	}
      }
    }

    return L;
  }
  

  // compute (small) \gamma
  function periodBase(V:number[],E:number[][]){
    //return(choleskyDecomposition(Gamma(V,E)));
    return(cholesky(Gamma(V,E)));
  }


  // fundamental graph
  function FundDomain({V, E}:{V:number[], E:number[][]}){
    const C = math.multiply(math.inv(getA(V,E)),incidenceMatrix(V,E));
    const C0:Matrix = math.subset(C, math.index([0,1,2], Array.from({length:E.length},(_,i)=>i)));
    const period=math.transpose(periodBase(V,E));
    const V0:Matrix = math.multiply(period, C0);
    //console.log(V0);
    //const [ecount, setEcount] = useState(0);
    let ecount = 0;

    // p + v0(e)
    function endpoint(edge:any, p:number[]){
      const v:any = math.squeeze(math.subset(V0 as Matrix,
					     math.index([0,1,2], edge.idx))  as math.MathCollection<math.MathNumericType>);
      return([p[0]+edge.dir*v[0],
	      p[1]+edge.dir*v[1],
	      p[2]+edge.dir*v[2]
      ]);
    }

    function line(p:number[],q:number[]){
      ecount += 1;
      const key = "key" + ecount;
      return(<CylinderBetween key={key} start={p} end={q} radius={0.02}/>);
    }


    // Euclidean distance from p to q in 3D
    function dist(p:any,q:any){
      return(Math.sqrt( (p[0]-q[0])*(p[0]-q[0])+
			(p[1]-q[1])*(p[1]-q[1])+
			(p[2]-q[2])*(p[2]-q[2])
      )
      );
    }

    // v in V(X_0),  p in  R^3
    function visitPoints(v:any, p:any, depth:number){
      
      if (depth > 4){
	return;
      }
      // check if p is already visited
      for (let q of visitedPoints[v]){
	if (dist(q,p) < 0.001) {
  	  return
	}
      }
      visitedPoints[v].push(p);
  
      let ecount = 0;
      for (let e of incidentEdges(v,E)){
	const q = endpoint(e,p);
	lines.push(line(p,q));
	// f is the next vertex to visit
	const f = (e.dir==1 ? E[e.idx][1] : E[e.idx][0]);
	visitPoints(f, q, depth+1);
	ecount++;
      }
    }

    //const visited = Array(E.length).fill(0);
    //const visited = E.map((_)=>0)
    const visitedPoints: number[][] = V.map((_)=>[]);
    //console.log(visited)
    const lines:any[] = [];
    //let start
    //const start:{idx:number; dir:number} ={idx:0, dir:1}
    //visitEdges(start,[0,0]);
    visitPoints(0,[0,0,0],0);
    //return visited;
    //console.log(lines.length);
    //console.log(visitedPoints);
    //console.log(visited);
    //return(<g key={key} transform={"translate(" + scale*translate.x + "," + scale*translate.y + ")"}> {lines} </g>);
    return(lines);
  }

  
  return (
  <div style={{width:"200dvh",height:"100dvh"}}>
    <Canvas>
      <OrbitControls/>
      <PerspectiveCamera makeDefault  {...{ position: [0.4, 3.4, 10], fov: 25 }} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="blue" />
      <FundDomain V={V} E={E}/>
    </Canvas>
  </div>
  );
}
