import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { TransaccionesService } from 'src/app/services/transacciones.service';
import { NgModel } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario.service';
import { CodigoCuenta } from "../../enums/codigo-cuenta";
import { CodigoTransaccion } from "../../enums/codigo-transaccion";

@Component({
  selector: 'app-intercambiar',
  templateUrl: './intercambiar.component.html',
  styleUrls: ['./intercambiar.component.css'],
})
export class IntercambiarComponent implements OnInit {
  userID: number = 0
  arsVsBtc: number = 0;
  montoDisponible: number = 0;
  cotizado: number = 0;
  monedaCotizado: string = '' ;
  monedasWallet:any = new Map ([
    ['Bitcoin', CodigoCuenta.Bitcoin],
    ['Pesos Argentinos', CodigoCuenta.PesosArgentinos],
  ])
  moneda: string = '';
  montoIngresado:number = 0
  fondosInsuficientes: boolean = false
  alertShow: boolean =false
  form = new FormGroup({
    cuentas: new FormControl( this.monedasWallet)
  })
  formIntercambiar = new FormGroup({
    monto : new FormControl(this.montoIngresado)
  })

  selectedValue:number = 0
  displayCuentaSeleccionada:boolean= false

  constructor(private _transaccionService: TransaccionesService, private usuarioService:UsuarioService) {}

  ngOnInit(): void {
    this.userID = parseInt(localStorage.getItem('userId')!)

    this.getPrecioBTCvsARS();
  }
  getPrecioBTCvsARS() {
    this._transaccionService.precioBTCvsUSD().subscribe(
      (resp) => {
        this.arsVsBtc = resp.market_data.current_price.ars;
        
      },
      (error) => console.log(error)
    );
  }

  getMontoDisponible(cuenta: number) {
    this._transaccionService.getTodasTransacciones(this.userID).subscribe(
      (resp) => {
        let haberes: number = 0;
        let deberes: number = 0;
        let respuesta = resp;

        for (let index = 0; index < respuesta.length; index++) {
          const element = respuesta[index];
          if (element.cuenta === cuenta) {
            haberes += element.haber;
            deberes += element.debe;
          }
        }
        const disponible = haberes - deberes;
        this.montoDisponible = disponible;
        console.log('Disponible', disponible);
      },
      (error) => console.log(error)
    );
  }

  cotizar(montoCambiar: number, cuentaOrigen: number) {
    let loCotizado: number ;
    if (montoCambiar > this.montoDisponible) {
      this.fondosInsuficientes = true
      this.cotizado = 0

      return 
    }
    this.fondosInsuficientes = false
    switch (cuentaOrigen) {
      case CodigoCuenta.PesosArgentinos:
        loCotizado = montoCambiar / this.arsVsBtc;
        this.monedaCotizado = 'BTC'
        break;
      case CodigoCuenta.Bitcoin:
        loCotizado = montoCambiar * this.arsVsBtc;
        this.monedaCotizado = 'ARS';
        break;

      default:
        loCotizado = 0;
        this.monedaCotizado = '';
        break;
    }
    this.cotizado = loCotizado;
  }
  reset(){
    this.selectedValue = 0
    this.displayCuentaSeleccionada = false
    this.montoIngresado= 0
    this.cotizado = 0
    this.monedaCotizado= ''
    this.fondosInsuficientes = false

  }

  intercambioTransacc(cuentaDebitar: number, montoDebitar: number) {
    let cuentaDestino: number =0;
    let montoDestino: number = 0;
    let precioBTC: number = this.arsVsBtc;
    if (montoDebitar == 0) {
      this.fondosInsuficientes = true
      return
    }
    switch (cuentaDebitar) {
      case CodigoCuenta.PesosArgentinos:
        cuentaDestino = CodigoCuenta.Bitcoin;
        montoDestino = montoDebitar / precioBTC;
        break;
      case CodigoCuenta.Bitcoin:
        cuentaDestino = CodigoCuenta.PesosArgentinos;
        montoDestino = montoDebitar * precioBTC;
        break;

      default:
        break;
    }

    this._transaccionService
      .cambioTransaccionDebitar(
        this.userID,
        cuentaDebitar,
        montoDebitar,
        precioBTC
      )
      .subscribe(
        (resp) => console.log(resp),
        (error) => console.log(error)
      );
    this._transaccionService
      .cambioTransaccionDestino(
        this.userID,
        cuentaDestino,
        montoDestino,
        precioBTC
      )
      .subscribe(
        (resp) => console.log(resp),
        (error) => console.log(error)
      );
      this.alertShow = true
      setTimeout(() => {
        location.reload()
      }, 500);
      
  }

  changeSuit(event:any){
    let cuentaSeleccionada:number = this.selectedValue
    this.displayCuentaSeleccionada = true
    this.getMontoDisponible(cuentaSeleccionada);
  }
  onSubmit(){
  let monto = this.formIntercambiar.value
  console.log('monto a cotizar',monto.monto);
  console.log('cuenta seleccionada', this.selectedValue)
  this.cotizar(monto.monto, this.selectedValue)

  }




}
