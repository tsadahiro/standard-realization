import * as math from 'mathjs';
import { Matrix } from 'mathjs';


export function neighbors(v:number,E:number[][]){
  const nei = [];
  for (let e of E){
    if (v == e[0]){
      nei.push(e[1]);
    }
    else if (v == e[1]){
      nei.push(e[0]);
    }
  }
  return nei;
}


export function incidentEdges(v:number,  E:number[][]){
  const inc = [];
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

export function cyclesFrom(start:number, length:number, E:number[][]){
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
  const A = [];
  console.log(cyclesFrom(0,3,E));
  //for (let length=2; length<=10; length++){
  //for (let length=2; length<=E.length; length++){
  //for (let length=E.length-1; length>=2; length--){
  for (let length = 6; length >= 2; length--){
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
export function getA(V:number[], E:number[][]){
  const M = incidenceMatrix(V,E);
  return(math.multiply(M,math.transpose(M)));
}


// Sunada's topological crystallography pp.146 Summary 2
export function Gamma(V:number[], E:number[][]){
  
  const A = getA(V,E);
  const b = A.length; // betch number
  const lowids = Array(b-2); // for 2D

  for (let i=0; i<b-2; i++){
    lowids[i]=i+2;
  }

  if (b == 2){
    return(A);
  }
  
  const A11 = math.subset(A, math.index([0,1],[0,1]));
  const A12 = math.subset(A, math.index([0,1], lowids));
  const A21 = math.subset(A, math.index(lowids, [0,1]));
  const A22 = math.subset(A, math.index(lowids, lowids));
  const Gamma = math.subtract(A11, math.multiply(math.multiply(A12, math.inv(A22)),A21));
  return(Gamma);
}

export function choleskyDecomposition(A:any) {
  const n = A.length;
  //const L = zeros(n, n)._data;
  const L:any = (math.zeros(n, n) as Matrix).toArray();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;

      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        L[i][j] = Math.sqrt(A[i][i] - sum);
      } else {
        L[i][j] = (1.0 / L[j][j]) * (A[i][j] - sum);
      }
    }
  }
  return L;
}

// compute (small) \gamma
export function periodBase(V:number[],E:number[][]){
  return(choleskyDecomposition(Gamma(V,E)));
}

//export function CyclesOfLength({length, V}){
//  return(V.map((v) => <CyclesFrom key={v+""+length} start={v} length={length}/>));
//}

export function Lattice2D({V,E}:
			  {V:number[], E:number[][]}){
  console.log(V,E);
  const scale = 100;
  const m = 5;
  const indices = Array.from({length:(2*m+1)},(_,i)=>i-m);
  //const indices = [0];
  const fund = fundDomain(scale,V,E);

  function lattice1D(s:number[], v:number[]){
    const line = [];
    for (let i of indices){
      const orgx = s[0]+i*v[0];
      const orgy = s[1]+i*v[1];
      const key = "f" + s[0] + s[1] + i;
      const transform = "translate(" + orgx*scale  + "," + orgy*scale + ")";
      line.push(<g key={key}
		   transform={transform}>{fund}</g>);
    }
    return line;
  }

  const base=periodBase(V, E);
  const lines = [];
  for (let i of indices){
  //for (let i of [1,2]){
    lines.push(lattice1D([base[1][0]*i, base[1][1]*i], base[0]));
  }
  return( <>{lines}</> );
}

// fundamental graph
export function fundDomain(scale:number, V:number[], E:number[][]){
  //console.log(V,E);
  const C = math.multiply(math.inv(getA(V,E)),incidenceMatrix(V,E));
  const C0:Matrix = math.subset(C, math.index([0,1], Array.from({length:E.length},(_,i)=>i)));
  const period=math.transpose(periodBase(V,E));
  const V0:Matrix = math.multiply(period, C0);
  console.log(V0);
  //const [ecount, setEcount] = useState(0);
  let ecount = 0;

  // p + v0(e)
  function endpoint(edge:any, p:number[]){
    const v:any = math.squeeze(math.subset(V0 as Matrix,
					   math.index([0,1], edge.idx))  as math.MathCollection<math.MathNumericType>);
    return([p[0]+edge.dir*v[0], p[1]+edge.dir*v[1]]);
  }

  function line(p:number[],q:number[]){
    ecount += 1;
    const key = "key" + ecount;
    return(<line key={key} strokeOpacity={1}
		 strokeWidth={2}
		 x1={scale*p[0]} y1={scale*p[1]}
		 x2={scale*q[0]} y2={scale*q[1]}
		 stroke="blue"
	   />);
  }



  // Euclidean distance from p to q in 2D
  function dist(p:any,q:any){
    return(Math.sqrt((p[0]-q[0])*(p[0]-q[0])+(p[1]-q[1])*(p[1]-q[1])));
  }
  
  function visitPoints(v:any, p:any, depth:number){
  
    if (depth > 3){
      return;
    }
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
      const f = (e.dir==1 ? E[e.idx][1] : E[e.idx][0]);
      visitPoints(f, q, depth+1);
      ecount++;
    }
  }
  

  //const visited = Array(E.length).fill(0);
  const visited = E.map((_)=>0)
  const visitedPoints:number[][] = V.map((_)=>[]);
  console.log(visited)
  const lines:any[] = [];
  visitPoints(0,[0,0],0);
  //return visited;
  //console.log(lines.length);
  //console.log(visitedPoints);
  console.log(visited);
  //return(<g key={key} transform={"translate(" + scale*translate.x + "," + scale*translate.y + ")"}> {lines} </g>);
  return(lines);
}
