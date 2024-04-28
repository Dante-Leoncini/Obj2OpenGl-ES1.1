import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit  {
  form: FormGroup = this.formBuilder.group({
    contenido: [''],
    TexturaWidth: [128],
    TexturaHeight: [256],
    resultado: ['']
  });
  error: string = "";

  constructor(
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(){
    //fetch('./assets/cubo.obj').then(response => response.text())
    fetch('./assets/seleccion.obj').then(response => response.text())
    .then(data => {
      this.f["contenido"].setValue(data);
      this.onSubmit();
    });      
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls;}

  onSubmit(){
    this.error = "";
    console.log("generando");
    var objVertices = 0;
    var objVerticesXYZ = "";
    var objNormalPosibles: any = [];
    var objNormalOrdenados: any = [];
    var objNormaldataModel = "";
    var objFacesIndices = "";
    var objTexPosibles: any = [];
    var objTexOrdenados: any = [];
    var objTexdataModel = "";

    var lines = this.f["contenido"].value.split('\n');
    var vertices: any = [];
    var normals: any = [];
    var uv: any = [];
    var faces: any = [];

    //un cubo tendria
    //24 normales
    //24 vertices
    //24 tex
    //12 caras

    //GL_BYTE es de -127 a 127 se puede 1/128
    //GL_SHORT es -32767 a 32767 se puede 1/32768

    for(var i = 0;i < lines.length;i++){
      //separa los vertices
      if (lines[i].substring(0, 2) == "v "){
        vertices.push(lines[i].substring(2).split(' '));
        objNormalOrdenados.push("");
        objTexOrdenados.push("");
      }
      //separa las normales
      else if (lines[i].substring(0, 3) == "vn "){
        normals.push(lines[i].substring(3).split(' '));
      }
      //separa las normales
      else if (lines[i].substring(0, 3) == "vt "){
        uv.push(lines[i].substring(3).split(' '));
      }
      //separa las caras
      else if (lines[i].substring(0, 2) == "f "){
        faces.push(lines[i].substring(2).split(' '));
      }
    }

    //formato UV
    for(var i = 0;i < uv.length;i++){
      objTexPosibles.push(`    ${this.tex("u",uv[i][0])},${this.tex("v",uv[i][1])}`);
      //objTexdataModel += `    tex(${this.tex("u",uv[i][0])},${this.tex("v",uv[i][1])})`;
      /*if (uv.length > i+1){
        objTexdataModel += ",\n"
      }*/
    }
    //console.log("uv: "+uv.length);
    console.log("minmax TEX "+this.tex("u",0)+", "+this.tex("v",1))

    //formato nuevo de normales
    for(var i = 0;i < normals.length;i++){
      var newNormals = "";
      for(var v = 0;v < normals[i].length; v++){
        //principio
        if(0 == v){newNormals += `    ${this.convertNormal(normals[i][v])},`}
        //final de vertices
        else if(normals[i].length == v+1 && normals.length <= i+1){
          newNormals += `${this.convertNormal(normals[i][v])}`
        }
        //final de linea
        else if(normals[i].length == v+1){
          newNormals += `${this.convertNormal(normals[i][v])}`
        }
        else {
          newNormals += `${this.convertNormal(normals[i][v])},`
        }
      }
      objNormalPosibles.push(newNormals);
    }
    //formato nuevo de vertices
    for(var i = 0;i < vertices.length;i++){
      var newVertices = "";
      for(var v = 0;v < vertices[i].length; v++){
        //principio
        if(0 == v){newVertices += `    ${this.verticeConvert(vertices[i][v])}, `}
        //final de vertices
        else if(vertices[i].length == v+1 && vertices.length <= i+1){
          newVertices += `${this.verticeConvert(vertices[i][v])}`
        }
        //final de linea
        else if(vertices[i].length == v+1){
          newVertices += `${this.verticeConvert(vertices[i][v])},\n`
        }
        else {
          newVertices += `${this.verticeConvert(vertices[i][v])}, `
        }
        /*//principio
        if(0 == v){newVertices += `    scalar(${vertices[i][v]}), `}
        //final de vertices
        else if(vertices[i].length == v+1 && vertices.length <= i+1){
          newVertices += `scalar(${vertices[i][v]})`
        }
        //final de linea
        else if(vertices[i].length == v+1){
          newVertices += `scalar(${vertices[i][v]}),\n`
        }
        else {
          newVertices += `scalar(${vertices[i][v]}), `
        }*/
      }
      objVertices++;
      objVerticesXYZ += newVertices;
    }
    console.log("posibles normales: "+objNormalPosibles.length);
    console.log("vertices: "+vertices.length);
    console.log("normales: "+objNormalOrdenados.length);
    console.log("caras: "+faces.length);
    console.log("tex: "+uv.length);

    //formato nuevo de Faces
    for(var i = 0;i < faces.length;i++){
      if (faces[i].length > 3){
        this.error = "Error, La malla 3d tiene caras de mas de 3 vertices";
        console.error(this.error);
      }
      //NOTA. el primer valor es el vertice, el segundo la textura y tercero la normal
      //ejemplo: v1/vt1/vn1
      //puede no tener textura, ejemplo: v1//vn1
      var vertice1 = faces[i][0].split('/');
      var vertice2 = faces[i][1].split('/');
      var vertice3 = faces[i][2].split('/');
      //caras      
      if (faces.length <= i+1){
        objFacesIndices += `    ${vertice1[0]-1},${vertice2[0]-1},${vertice3[0]-1}`;
      }
      else {
        objFacesIndices += `    ${vertice1[0]-1},${vertice2[0]-1},${vertice3[0]-1},\n`;
      }   
      //normales
      //console.log("cara: "+(i+1)+" vertices: "+vertice1[0]+", "+vertice2[0]+", "+vertice3[0]);
      objNormalOrdenados[vertice1[0]-1] = objNormalPosibles[vertice1[2]-1];
      objNormalOrdenados[vertice2[0]-1] = objNormalPosibles[vertice2[2]-1];
      objNormalOrdenados[vertice3[0]-1] = objNormalPosibles[vertice3[2]-1];
      //texturas
      objTexOrdenados[vertice1[0]-1] = objTexPosibles[vertice1[1]-1];
      objTexOrdenados[vertice2[0]-1] = objTexPosibles[vertice2[1]-1];
      objTexOrdenados[vertice3[0]-1] = objTexPosibles[vertice3[1]-1];
    }
    for(var i = 0;i < objNormalOrdenados.length;i++){
      objNormaldataModel += objNormalOrdenados[i];
      objTexdataModel += objTexOrdenados[i];
      if (objNormalOrdenados.length > i+1){
        objNormaldataModel += `,\n`;
        objTexdataModel += `,\n`;
      }
    }

/** Vertices for the Model object. */
//static const GLshort objVertexdataModel[]={
//  ${objVerticesXYZ}
//  };
/*
#define scalar(a) ((short)(a*1))
#define MATERIALCOLOR(r, g, b, a)     \\
       (GLfloat)(r * MATERIAL_MAX),   \\
       (GLfloat)(g * MATERIAL_MAX),   \\
       (GLfloat)(b * MATERIAL_MAX),   \\
       (GLfloat)(a * MATERIAL_MAX)
       
*/
/* Macro for changing the input texture coordinate values from
   GLubyte [0,255] to GLbyte [-128,127]. See more info below. */
   //#define tex(u,v) (GLbyte)( (u) - 128 ) , (GLbyte)( (v) - 128 )

// CONSTANTS
/* Materials for the model object. */
//static const GLfloat objDiffuseModel[4]  = { MATERIALCOLOR(0.8, 0.8, 0.2, 1.0) };
//static const GLfloat objAmbientModel[4]  = { MATERIALCOLOR(0.8, 0.8, 0.2, 1.0) };
//static const GLfloat objSpecularModel[4] = { MATERIALCOLOR(1.0, 1.0, 1.0, 1.0) };



    this.f["resultado"].setValue(
`// MACROS
#define MATERIAL_MAX 1
#define objVerticesModel    ${objVertices}
#define objFacesModel       ${faces.length}

/** Vertices for the Model object. */
static const GLshort objVertexdataModel[${vertices.length} * 3]={
${objVerticesXYZ}
};

/* Define normals for the cube */
static const GLbyte objNormaldataModel[${objNormalOrdenados.length} * 3]={
${objNormaldataModel}
};

/** Indices to the Model object vertices. */
static const GLushort objFacedataModel[${faces.length} * 3]={
${objFacesIndices}
};

/* textura UV */
static const GLbyte objTexdataModel[${uv.length} * 2] ={
${objTexdataModel}
};`);   
    
    //this.texto2 = this.f["contenido"].value;
  }

  verticeConvert(v: any){
    return Math.round(v*5000);
  }

  //convierte las normales de -1 a 1. a -128 a 128
  convertNormal(normal: any){
    var original = Math.round(normal*127);
    return original
  }

  //textura redondeo
  tex(uv: string,num: number){
    if (uv == "u"){
      return Math.round((num-0.5)*127*2)
    }
    else if (uv == "v"){
      return -Math.round((num-0.5)*127*2)
    }
    return "";
  }

  guardar(){

  }

}
