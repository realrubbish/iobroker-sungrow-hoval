# iobroker
Power Management with Sungrow PV Inverter, Hoval Heat Pump &amp; Shelly Meter &amp; Switches

![ioBroker Overview](img/Overview_toby.drawio.svg)

## PV system
  - Inverter: Sungrow SH20T with 3 MPP-Trackers
  - Battery: Sungrow SBR096 9.6 kWh
  - PV-Panels: 56x DAS Solar 445W Panels (2x strings with 19 panels, 1x string with 18 panels)

## Sungrow Modbus Integration
Since WiNet-S / WiNet-S2 does not provide reliable data until now we use the external RS485 connection.

- Model: [Waveshare RS485 to POE](https://www.waveshare.com/wiki/RS485_TO_POE_ETH_(B))
- Connection: SH20T "Logger" port on COM2 ![sungrow_com2_logger.png](img/sungrow_com2_logger.png)
- Settings: [Waveshare parameters](Waveshare-Modbus/parameters.md)

## Hoval Heat Pump
  - Model: Ultrascource B
  - Buffer: 300 lt

### Hoval CANbus Integration
The Hoval Modbus gateway seemed to be too expensive, so we decided to go for a CANbus gateway.
- Model: [Hoval CAN-Gateway](https://github.com/wladwnt/CAN-Gateway)

### Hoval SmartGrid
Hoval Smart Grid Ready comes with these options:

| Nr  | Description    |
|-----|----------------|
| `0` | Normal         |
| `1` | Vorzugsbetrieb |
| `2` | Sperrbetrieb   |
| `3` | Abnahmezwang   |

---

A Shelly 2-Channel Relay was used to control 2 Smart Grid inputs of the Howal Control Unit. Before the inputs are usable they have to be defined:
  - set param=0;1;0;0;38013;w;Ausloeser_Smart_Grid_Funktion to `1` (= Eingangskontakte)
  - set param=0;1;0;0;30052;w;Zuo._Eing._SmartGrid_1 to `4` (= VE1)
  - set param=0;1;0;0;30053;w;Zuo._Eing._SmartGrid_2 to `5` (= VE2)

VE1 and VE2 are two ports on the Heatpump controller baord. **TODO**: Add picture 

---

In [HovalSmartGrid.pdf](img/HovalSmartGrid.pdf) it's described how to combine the input contacts and how that effects the components of the heating system:

![HovalSmartGridContacts](img/HovalSmartGridContacts.png)

---

> [!NOTE] 
> Actually it should be possible to set the smart grid state through CANbus. I can see the registers:
>  - param=0;1;0;0;38013;w;Ausloeser_Smart_Grid_Funktion;10;U8;1.000000;0.000000;
>  - param=0;1;0;0;38012;w;Smart_Grid_ueber_Systembus;10;U8;1.000000;0.000000;
> 
> But nothing happens when I set the Ausloeser_Smart_Grid_Funktion to `2` (= Systembus) and Smart_Grid_ueber_Systembus to `1`, `2` or `3`. The  
>
> If you managed to solve this problem please let me know.
