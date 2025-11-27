import { useState } from 'react'
import {FormControlLabel, Radio, RadioGroup, Stack, Button, TextareaAutosize} from '@mui/material';
import {Lattice2D} from './StdReal.tsx';
import Lattice3D from './components/Lattice3D';
import Textarea from '@mui/joy/Textarea';

function App() {

  const [drawing, setDrawing] = useState<boolean>(false);
  const [eString, setEString] = useState("");
  const [E, setE] = useState<number[][]>([]);
  const [V, setV] = useState<number[]>([]);
  const [dim, setDim] = useState<number>(2);

  function eStringHandler(s:string){
    setEString(s);
  }
  
  function draw(){
    setDrawing((prev)=>!prev);
    const edgeStrs = eString.split("\n");
    const edges = edgeStrs.map((s)=>s.trim())
			  .filter(s => s.length > 0)
			  .map((es)=>es.split(",").map((vs)=>parseInt(vs,10)));
    setE(()=>edges);
    const vertices:number[] = [];
    for (let e of edges){
      if ( !vertices.includes(e[0])){
	vertices.push(e[0])
      }
      if ( !vertices.includes(e[1])){
	vertices.push(e[1])
      }
    }
    setV(()=>vertices);
    console.log(vertices);
  }

  
  return (
    <>
	    <Stack>
	      <Stack >
		<Stack direction="row">
		  <Button variant="contained" onClick={draw}>
		    {drawing? "reset":"draw"}
		  </Button>
		  {!drawing && (
		  <RadioGroup aria-label="gender" name="gender1" value={dim}
			      onChange={(e)=>{setDim((prev)=>e.target.value)}}>
		    <FormControlLabel value={2} control={<Radio />} label="2D" />
		    <FormControlLabel value={3} control={<Radio />} label="3D" />
		  </RadioGroup>
		  )}
		</Stack>
		{ drawing? <></>:
		  (
		      <Stack direction="row">
			<Textarea key="areaB"
					  minRows={10}
					  maxRows={10}
					  placeholder="edges"
					  onChange={(e)=>eStringHandler(e.target.value)}
					  style={{width:300}}
					  variant="solid"
			/>
		      </Stack>
		    )
		  }
		</Stack>
		<Stack>
		  {drawing?(
		    <>
		      {dim == 2 ? 
		      (<svg width={800} height={600}>
		      <Lattice2D V={V} E={E}></Lattice2D>
 		      </svg>)
		      :
		      <Lattice3D/>
		      }
		      <div>{eString.split("\n").map((e)=><div>{e}</div>)}</div>
		    </>
		    ):
		  (<></>)}
		</Stack>
	    </Stack>
    </>
  )
}
//		  {fundDomain(50)}
//      <div className="card">
//	  <PathsOfLength length={1}/>
//      </div>"

export default App
