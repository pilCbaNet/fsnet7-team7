import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Login } from '../models/login';
import {map} from 'rxjs/operators';
import { Router } from '@angular/router';
import { Usuario } from '../models/usuario';
import {formatDate} from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  date: number

  url:string='https://localhost:7206/api/usuario/login';

  loggedIn : BehaviorSubject<boolean>;
  currentUserSubject:BehaviorSubject<Usuario>;



  constructor(private http: HttpClient, private router:Router
    ) {
      this.date = Date.now();
      console.log("El servicio UsuarioService está funcionando")
      this.currentUserSubject = new BehaviorSubject<Usuario>(JSON.parse(localStorage.getItem('currentUser')||'{}'));
      this.loggedIn= new BehaviorSubject<boolean>(false);

      console.log("El servicio UsuarioService está funcionando", this.currentUserSubject)
      console.log("El servicio UsuarioService está funcionando", this.loggedIn)
     }

  getUsuario(email: string):Observable<any>
  {
  let params = new HttpParams().set('email', email);
    return this.http.get("http://localhost:3000/usuario/", {params: params} );
  }

  setUsuario(email:string, password:string,enteredNombre:string, enteredApellido:string):Observable<any>
   {
  //   let params = new HttpParams().set('email', email);
  //   return this.http.post("http://localhost:3000/usuario/",{params: params})
      return this.http.post("https://localhost:7206/api/usuario/registro",{

  email:email,
  password:password,
  nombre:enteredNombre,
  apellido:enteredApellido ,
  //fechaNacimiento: formatDate(this.date, 'dd/MM/yyyy - HH:mm' , 'en')+' hrs',
      //cbu: Math.round(Math.random()*10000000000 )
      },{ responseType: "json" , withCredentials: false  });


  }

  getUsuarioId(id: number):Observable<any>
  {
  let params = new HttpParams().set('id', id);
    return this.http.get("http://localhost:3000/usuario/", {params: params} );

  }

  get usuarioAutenticado():Usuario{
    return this.currentUserSubject.value}

  get estaAutenticado():Observable< boolean>{

    if(!this.loggedIn.getValue())
    {
       this.router.navigate(['home']);
    }
    return this.loggedIn.asObservable();
  }

  iniciarSesion(login:Login):Observable<any>
  {
      return this.http.post<any>(this.url,login).pipe(map(data=>{
        let userId = data.idUsuario
        localStorage.setItem('userId', userId )
        sessionStorage.setItem('currentUser',JSON.stringify(data));//data.idUsuario
        this.currentUserSubject.next(data);
        this.loggedIn.next(true);
        return data;
      }));
  }

  logout():void
  {
    localStorage.removeItem('userId')
    sessionStorage.removeItem('currentUser');

    this.loggedIn.next(true);
  }




}
