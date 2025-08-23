"use client";


"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, UserPlus, PlusCircle, Trash2 } from 'lucide-react';
import { AnimalLogo, animals } from '@/components/icons/animal-logo';
import { AnimatePresence, motion } from 'framer-motion';
import { CenterCard } from '@/components/app/center-card';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, setDoc, updateDoc, serverTimestamp, arrayUnion, getDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { joinCenterWithCode, getCenterCoursesByCode } from '@/lib/actions';

// --- Location Data ---
const locationData = {
    "Argentina": {
        "Buenos Aires": ["La Plata", "Mar del Plata", "Quilmes", "Bahía Blanca", "San Isidro", "Vicente López", "Avellaneda", "Lanús", "Lomas de Zamora", "Tres de Febrero", "Morón", "Pilar", "Tigre", "San Fernando", "Escobar", "Zárate", "Campana", "Tandil", "Olavarría", "Junín", "Pergamino", "San Nicolás de los Arroyos"],
        "Catamarca": ["San Fernando del Valle de Catamarca", "Andalgalá", "Belén", "Santa María", "Tinogasta", "Recreo"],
        "Chaco": ["Resistencia", "Barranqueras", "Fontana", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Castelli"],
        "Chubut": ["Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel", "Sarmiento"],
        "Ciudad Autónoma de Buenos Aires": ["Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya", "Núñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield", "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"],
        "Córdoba": ["Córdoba", "Río Cuarto", "Villa María", "Villa Carlos Paz", "San Francisco", "Alta Gracia", "Jesús María", "Bell Ville", "La Falda", "Cosquín"],
        "Corrientes": ["Corrientes", "Goya", "Paso de los Libres", "Curuzú Cuatiá", "Mercedes", "Santo Tomé"],
        "Entre Ríos": ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Gualeguay", "Villaguay", "Victoria"],
        "Formosa": ["Formosa", "Clorinda", "Pirané", "El Colorado"],
        "Jujuy": ["San Salvador de Jujuy", "Palpalá", "San Pedro de Jujuy", "Libertador General San Martín", "La Quiaca", "Humahuaca"],
        "La Pampa": ["Santa Rosa", "General Pico", "Toay", "General Acha", "Victorica"],
        "La Rioja": ["La Rioja", "Chilecito", "Aimogasta", "Chepes", "Villa Unión"],
        "Mendoza": ["Mendoza", "Godoy Cruz", "Guaymallén", "Las Heras", "Maipú", "Luján de Cuyo", "San Rafael", "San Martín", "General Alvear"],
        "Misiones": ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Apóstoles", "Leandro N. Alem"],
        "Neuquén": ["Neuquén", "Plottier", "Centenario", "San Martín de los Andes", "Zapala", "Cutral Có", "Villa La Angostura"],
        "Río Negro": ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Villa Regina", "Allen", "El Bolsón"],
        "Salta": ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "General Güemes", "Rosario de la Frontera", "Cafayate"],
        "San Juan": ["San Juan", "Rivadavia", "Santa Lucía", "Chimbas", "Rawson", "Caucete", "Jáchal"],
        "San Luis": ["San Luis", "Villa Mercedes", "Merlo", "La Punta", "Justo Daract"],
        "Santa Cruz": ["Río Gallegos", "Caleta Olivia", "Pico Truncado", "Las Heras", "El Calafate", "Puerto Deseado"],
        "Santa Fe": ["Santa Fe", "Rosario", "Venado Tuerto", "Rafaela", "Reconquista", "Santo Tomé", "Villa Gobernador Gálvez"],
        "Santiago del Estero": ["Santiago del Estero", "La Banda", "Termas de Río Hondo", "Frías", "Añatuya"],
        "Tierra del Fuego": ["Ushuaia", "Río Grande", "Tolhuin"],
        "Tucumán": ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Concepción", "Banda del Río Salí", "Aguilares"]
    },
    "Bolivia": {
        "Beni": ["Trinidad", "Riberalta", "Guayaramerín", "San Borja", "Rurrenabaque"],
        "Chuquisaca": ["Sucre", "Monteagudo", "Camargo", "Padilla"],
        "Cochabamba": ["Cochabamba", "Quillacollo", "Sacaba", "Tiquipaya", "Colcapirhua", "Vinto"],
        "La Paz": ["La Paz", "El Alto", "Viacha", "Achocalla", "Coroico", "Copacabana"],
        "Oruro": ["Oruro", "Challapata", "Huanuni", "Caracollo"],
        "Pando": ["Cobija", "Porvenir", "Bella Flor"],
        "Potosí": ["Potosí", "Uyuni", "Tupiza", "Villazón", "Llallagua"],
        "Santa Cruz": ["Santa Cruz de la Sierra", "Montero", "Warnes", "La Guardia", "El Torno", "Cotoca"],
        "Tarija": ["Tarija", "Yacuiba", "Villa Montes", "Bermejo", "Entre Ríos"]
    },
    "Chile": {
        "Arica y Parinacota": ["Arica", "Putre", "Camarones"],
        "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica"],
        "Antofagasta": ["Antofagasta", "Calama", "Tocopilla", "Mejillones", "Taltal"],
        "Atacama": ["Copiapó", "Vallenar", "Chañaral", "Caldera", "Huasco"],
        "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Vicuña"],
        "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio", "Los Andes", "Quillota", "San Felipe"],
        "Metropolitana de Santiago": ["Santiago", "Puente Alto", "Maipú", "La Florida", "Las Condes", "Providencia", "Ñuñoa", "San Bernardo", "Peñalolén"],
        "O'Higgins": ["Rancagua", "San Fernando", "Rengo", "Machalí", "Pichilemu"],
        "Maule": ["Talca", "Curicó", "Linares", "Constitución", "Cauquenes"],
        "Ñuble": ["Chillán", "San Carlos", "Coihueco", "Bulnes"],
        "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Hualpén", "Chiguayante", "San Pedro de la Paz"],
        "La Araucanía": ["Temuco", "Padre Las Casas", "Villarrica", "Angol", "Pucón"],
        "Los Ríos": ["Valdivia", "La Unión", "Panguipulli", "Río Bueno"],
        "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Ancud", "Puerto Varas"],
        "Aysén": ["Coyhaique", "Puerto Aysén", "Chile Chico"],
        "Magallanes": ["Punta Arenas", "Puerto Natales", "Porvenir"]
    },
    "Colombia": {
        "Amazonas": ["Leticia", "Puerto Nariño"],
        "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta", "Rionegro", "Apartadó"],
        "Arauca": ["Arauca", "Saravena", "Tame"],
        "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga"],
        "Bogotá D.C.": ["Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos", "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda", "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz"],
        "Bolívar": ["Cartagena de Indias", "Magangué", "El Carmen de Bolívar", "Turbaco"],
        "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Villa de Leyva"],
        "Caldas": ["Manizales", "Villamaría", "La Dorada", "Chinchiná"],
        "Caquetá": ["Florencia", "San Vicente del Caguán"],
        "Casanare": ["Yopal", "Aguazul", "Villanueva"],
        "Cauca": ["Popayán", "Santander de Quilichao"],
        "Cesar": ["Valledupar", "Aguachica", "Agustín Codazzi"],
        "Chocó": ["Quibdó", "Istmina"],
        "Córdoba": ["Montería", "Cereté", "Sahagún", "Lorica"],
        "Cundinamarca": ["Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot"],
        "Guainía": ["Inírida"],
        "Guaviare": ["San José del Guaviare"],
        "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata"],
        "La Guajira": ["Riohacha", "Maicao", "Uribia"],
        "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "El Banco"],
        "Meta": ["Villavicencio", "Acacías", "Granada"],
        "Nariño": ["Pasto", "Tumaco", "Ipiales"],
        "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario"],
        "Putumayo": ["Mocoa", "Puerto Asís", "Orito"],
        "Quindío": ["Armenia", "Calarcá", "Montenegro"],
        "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
        "San Andrés y Providencia": ["San Andrés", "Providencia"],
        "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
        "Sucre": ["Sincelejo", "Corozal", "Tolú"],
        "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda"],
        "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Buga", "Cartago", "Jamundí", "Yumbo"],
        "Vaupés": ["Mitú"],
        "Vichada": ["Puerto Carreño"]
    },
    "Costa Rica": {
        "Alajuela": ["Alajuela", "San Ramón", "Grecia", "Atenas", "Naranjo", "Palmares", "Poás", "Orotina", "San Mateo", "Zarcero", "Sarchí", "Upala", "Los Chiles", "Guatuso", "Río Cuarto"],
        "Cartago": ["Cartago", "Paraíso", "La Unión", "Jiménez", "Turrialba", "Alvarado", "Oreamuno", "El Guarco"],
        "Guanacaste": ["Liberia", "Nicoya", "Santa Cruz", "Bagaces", "Carrillo", "Cañas", "Abangares", "Tilarán", "Nandayure", "La Cruz", "Hojancha"],
        "Heredia": ["Heredia", "Barva", "Santo Domingo", "Santa Bárbara", "San Rafael", "San Isidro", "Belén", "Flores", "San Pablo", "Sarapiquí"],
        "Limón": ["Limón", "Pococí", "Siquirres", "Talamanca", "Matina", "Guácimo"],
        "Puntarenas": ["Puntarenas", "Esparza", "Buenos Aires", "Montes de Oro", "Osa", "Quepos", "Golfito", "Coto Brus", "Parrita", "Corredores", "Garabito"],
        "San José": ["San José", "Escazú", "Desamparados", "Puriscal", "Tarrazú", "Aserrí", "Mora", "Goicoechea", "Santa Ana", "Alajuelita", "Vázquez de Coronado", "Acosta", "Tibás", "Moravia", "Montes de Oca", "Turrubares", "Dota", "Curridabat", "Pérez Zeledón", "León Cortés Castro"]
    },
    "Cuba": {
        "Artemisa": ["Artemisa", "Bauta", "San Cristóbal", "Guanajay"],
        "Camagüey": ["Camagüey", "Florida", "Nuevitas", "Guáimaro"],
        "Ciego de Ávila": ["Ciego de Ávila", "Morón", "Ciro Redondo"],
        "Cienfuegos": ["Cienfuegos", "Cruces", "Palmira", "Abreus"],
        "Granma": ["Bayamo", "Manzanillo", "Yara", "Jiguaní"],
        "Guantánamo": ["Guantánamo", "Baracoa", "Imías", "Maisí"],
        "Holguín": ["Holguín", "Banes", "Moa", "Mayarí"],
        "Isla de la Juventud": ["Nueva Gerona"],
        "La Habana": ["Plaza de la Revolución", "Habana Vieja", "Centro Habana", "Diez de Octubre", "Playa", "Marianao"],
        "Las Tunas": ["Victoria de Las Tunas", "Puerto Padre", "Amancio"],
        "Matanzas": ["Matanzas", "Cárdenas", "Jovellanos", "Varadero"],
        "Mayabeque": ["San José de las Lajas", "Güines", "Jaruco"],
        "Pinar del Río": ["Pinar del Río", "Consolación del Sur", "Viñales"],
        "Sancti Spíritus": ["Sancti Spíritus", "Trinidad", "Cabaiguán"],
        "Santiago de Cuba": ["Santiago de Cuba", "Palma Soriano", "Contramaestre"],
        "Villa Clara": ["Santa Clara", "Sagua la Grande", "Caibarién", "Remedios"]
    },
    "Ecuador": {
        "Azuay": ["Cuenca", "Gualaceo", "Paute", "Sígsig", "Girón"],
        "Bolívar": ["Guaranda", "San Miguel", "Chillanes"],
        "Cañar": ["Azogues", "Cañar", "La Troncal", "Biblián"],
        "Carchi": ["Tulcán", "San Gabriel", "El Ángel"],
        "Chimborazo": ["Riobamba", "Alausí", "Guano", "Chunchi"],
        "Cotopaxi": ["Latacunga", "Salcedo", "Pujilí", "Saquisilí"],
        "El Oro": ["Machala", "Santa Rosa", "Huaquillas", "Pasaje"],
        "Esmeraldas": ["Esmeraldas", "Atacames", "Muisne", "Quinindé"],
        "Galápagos": ["Puerto Baquerizo Moreno", "Puerto Ayora", "Puerto Villamil"],
        "Guayas": ["Guayaquil", "Durán", "Samborondón", "Daule", "Milagro", "Salinas"],
        "Imbabura": ["Ibarra", "Otavalo", "Cotacachi", "Atuntaqui"],
        "Loja": ["Loja", "Catamayo", "Cariamanga", "Macará"],
        "Los Ríos": ["Babahoyo", "Quevedo", "Vinces", "Ventanas"],
        "Manabí": ["Portoviejo", "Manta", "Chone", "Bahía de Caráquez", "Jipijapa"],
        "Morona Santiago": ["Macas", "Gualaquiza", "Sucúa"],
        "Napo": ["Tena", "Archidona", "El Chaco"],
        "Orellana": ["Francisco de Orellana (El Coca)", "La Joya de los Sachas"],
        "Pastaza": ["Puyo", "Mera", "Santa Clara"],
        "Pichincha": ["Quito", "Cayambe", "Machachi", "Sangolquí", "Tabacundo"],
        "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
        "Santo Domingo de los Tsáchilas": ["Santo Domingo"],
        "Sucumbíos": ["Nueva Loja (Lago Agrio)", "Shushufindi", "Cascales"],
        "Tungurahua": ["Ambato", "Baños de Agua Santa", "Pelileo", "Píllaro"],
        "Zamora Chinchipe": ["Zamora", "Yantzaza", "Zumba"]
    },
    "El Salvador": {
        "Ahuachapán": ["Ahuachapán", "Atiquizaya", "Concepción de Ataco", "Tacuba"],
        "Cabañas": ["Sensuntepeque", "Ilobasco", "Victoria"],
        "Chalatenango": ["Chalatenango", "Nueva Concepción", "La Palma"],
        "Cuscatlán": ["Cojutepeque", "Suchitoto", "San Pedro Perulapán"],
        "La Libertad": ["Santa Tecla", "Antiguo Cuscatlán", "Zaragoza", "Colón", "San Juan Opico"],
        "La Paz": ["Zacatecoluca", "Olocuilta", "San Juan Talpa", "Santiago Nonualco"],
        "La Unión": ["La Unión", "Santa Rosa de Lima", "Conchagua"],
        "Morazán": ["San Francisco Gotera", "Corinto", "Jocoro", "Perquín"],
        "San Miguel": ["San Miguel", "Chinameca", "Ciudad Barrios", "El Tránsito"],
        "San Salvador": ["San Salvador", "Soyapango", "Mejicanos", "Apopa", "Ilopango", "Delgado"],
        "San Vicente": ["San Vicente", "Apastepeque", "Tecoluca"],
        "Santa Ana": ["Santa Ana", "Chalchuapa", "Metapán", "Coatepeque"],
        "Sonsonate": ["Sonsonate", "Acajutla", "Izalco", "Nahuizalco"],
        "Usulután": ["Usulután", "Jiquilisco", "Santiago de María", "Berlín"]
    },
    "España": {
        "Andalucía": ["Sevilla", "Málaga", "Córdoba", "Granada", "Jerez de la Frontera", "Almería", "Huelva", "Cádiz"],
        "Aragón": ["Zaragoza", "Huesca", "Teruel"],
        "Asturias": ["Oviedo", "Gijón", "Avilés"],
        "Baleares": ["Palma de Mallorca", "Ibiza", "Mahón"],
        "Canarias": ["Las Palmas de Gran Canaria", "Santa Cruz de Tenerife", "La Laguna", "Telde"],
        "Cantabria": ["Santander", "Torrelavega", "Castro-Urdiales"],
        "Castilla-La Mancha": ["Toledo", "Albacete", "Ciudad Real", "Guadalajara", "Cuenca"],
        "Castilla y León": ["Valladolid", "León", "Burgos", "Salamanca", "Palencia", "Ávila", "Segovia", "Soria", "Zamora"],
        "Cataluña": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Tarragona", "Lleida", "Girona"],
        "Ceuta": ["Ceuta"],
        "Comunidad Valenciana": ["Valencia", "Alicante", "Elche", "Castellón de la Plana"],
        "Comunidad de Madrid": ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón"],
        "Extremadura": ["Badajoz", "Cáceres", "Mérida"],
        "Galicia": ["A Coruña", "Vigo", "Ourense", "Lugo", "Santiago de Compostela"],
        "La Rioja": ["Logroño"],
        "Melilla": ["Melilla"],
        "Navarra": ["Pamplona", "Tudela"],
        "País Vasco": ["Bilbao", "Vitoria-Gasteiz", "San Sebastián"],
        "Región de Murcia": ["Murcia", "Cartagena", "Lorca"]
    },
    "Guatemala": {
        "Alta Verapaz": ["Cobán", "San Pedro Carchá", "San Juan Chamelco"],
        "Baja Verapaz": ["Salamá", "Rabinal", "Cubulco"],
        "Chimaltenango": ["Chimaltenango", "Tecpán Guatemala", "Patzún"],
        "Chiquimula": ["Chiquimula", "Esquipulas", "Jocotán"],
        "El Progreso": ["Guastatoya", "Sanarate", "El Jícaro"],
        "Escuintla": ["Escuintla", "Santa Lucía Cotzumalguapa", "Tiquisate", "Puerto San José"],
        "Guatemala": ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "San Miguel Petapa", "Amatitlán", "Villa Canales"],
        "Huehuetenango": ["Huehuetenango", "Chiantla", "Jacaltenango"],
        "Izabal": ["Puerto Barrios", "Morales", "Livingston"],
        "Jalapa": ["Jalapa", "San Pedro Pinula", "Mataquescuintla"],
        "Jutiapa": ["Jutiapa", "Asunción Mita", "El Progreso"],
        "Petén": ["Flores", "San Benito", "Poptún"],
        "Quetzaltenango": ["Quetzaltenango", "Coatepeque", "Salcajá"],
        "Quiché": ["Santa Cruz del Quiché", "Chichicastenango", "Nebaj"],
        "Retalhuleu": ["Retalhuleu", "San Sebastián", "Champerico"],
        "Sacatepéquez": ["Antigua Guatemala", "Sumpango", "Ciudad Vieja"],
        "San Marcos": ["San Marcos", "San Pedro Sacatepéquez", "Malacatán"],
        "Santa Rosa": ["Cuilapa", "Barberena", "Chiquimulilla"],
        "Sololá": ["Sololá", "Panajachel", "Santiago Atitlán"],
        "Suchitepéquez": ["Mazatenango", "Chicacao", "Cuyotenango"],
        "Totonicapán": ["Totonicapán", "San Cristóbal Totonicapán"],
        "Zacapa": ["Zacapa", "Gualán", "La Unión"]
    },
    "Honduras": {
        "Atlántida": ["La Ceiba", "Tela", "Arizona"],
        "Choluteca": ["Choluteca", "San Marcos de Colón", "El Triunfo"],
        "Colón": ["Trujillo", "Tocoa", "Sonaguera"],
        "Comayagua": ["Comayagua", "Siguatepeque", "La Libertad"],
        "Copán": ["Santa Rosa de Copán", "La Entrada", "Florida"],
        "Cortés": ["San Pedro Sula", "Choloma", "Puerto Cortés", "Villanueva"],
        "El Paraíso": ["Danlí", "El Paraíso", "Yuscarán"],
        "Francisco Morazán": ["Tegucigalpa", "Comayagüela", "Talanga", "Valle de Ángeles"],
        "Gracias a Dios": ["Puerto Lempira", "Brus Laguna"],
        "Intibucá": ["La Esperanza", "Intibucá", "Jesús de Otoro"],
        "Islas de la Bahía": ["Roatán", "Utila", "Guanaja"],
        "La Paz": ["La Paz", "Marcala", "Cane"],
        "Lempira": ["Gracias", "Erandique", "La Virtud"],
        "Ocotepeque": ["Ocotepeque", "San Marcos", "Sinuapa"],
        "Olancho": ["Juticalpa", "Catacamas", "Campamento"],
        "Santa Bárbara": ["Santa Bárbara", "Quimistán", "Las Vegas"],
        "Valle": ["Nacaome", "San Lorenzo", "Amapala"],
        "Yoro": ["Yoro", "El Progreso", "Olanchito", "Morazán"]
    },
    "México": {
        "Aguascalientes": ["Aguascalientes", "Jesús María", "Calvillo"],
        "Baja California": ["Mexicali", "Tijuana", "Ensenada", "Tecate", "Rosarito"],
        "Baja California Sur": ["La Paz", "Los Cabos", "Comondú"],
        "Campeche": ["Campeche", "Ciudad del Carmen", "Champotón"],
        "Chiapas": ["Tuxtla Gutiérrez", "Tapachula", "San Cristóbal de las Casas", "Comitán"],
        "Chihuahua": ["Chihuahua", "Ciudad Juárez", "Delicias", "Cuauhtémoc", "Parral"],
        "Ciudad de México": ["Coyoacán", "Cuauhtémoc", "Benito Juárez", "Miguel Hidalgo", "Iztapalapa", "Gustavo A. Madero", "Xochimilco", "Tlalpan"],
        "Coahuila": ["Saltillo", "Torreón", "Monclova", "Piedras Negras", "Acuña"],
        "Colima": ["Colima", "Manzanillo", "Tecomán", "Villa de Álvarez"],
        "Durango": ["Durango", "Gómez Palacio", "Lerdo"],
        "Guanajuato": ["Guanajuato", "León", "Irapuato", "Celaya", "Salamanca", "San Miguel de Allende"],
        "Guerrero": ["Chilpancingo", "Acapulco", "Iguala", "Zihuatanejo"],
        "Hidalgo": ["Pachuca", "Tulancingo", "Tula de Allende"],
        "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta", "Lagos de Moreno"],
        "México (Estado de)": ["Toluca", "Ecatepec", "Nezahualcóyotl", "Naucalpan", "Tlalnepantla", "Atizapán de Zaragoza"],
        "Michoacán": ["Morelia", "Uruapan", "Zamora", "Lázaro Cárdenas"],
        "Morelos": ["Cuernavaca", "Jiutepec", "Cuautla"],
        "Nayarit": ["Tepic", "Bahía de Banderas", "Compostela"],
        "Nuevo León": ["Monterrey", "Guadalupe", "Apodaca", "San Nicolás de los Garza", "San Pedro Garza García", "Santa Catarina"],
        "Oaxaca": ["Oaxaca de Juárez", "Salina Cruz", "Juchitán de Zaragoza", "Tuxtepec"],
        "Puebla": ["Puebla", "Tehuacán", "San Andrés Cholula", "San Pedro Cholula"],
        "Querétaro": ["Querétaro", "San Juan del Río", "Corregidora"],
        "Quintana Roo": ["Chetumal", "Cancún", "Playa del Carmen", "Cozumel"],
        "San Luis Potosí": ["San Luis Potosí", "Soledad de Graciano Sánchez", "Ciudad Valles"],
        "Sinaloa": ["Culiacán", "Mazatlán", "Los Mochis"],
        "Sonora": ["Hermosillo", "Ciudad Obregón", "Nogales", "San Luis Río Colorado"],
        "Tabasco": ["Villahermosa", "Cárdenas", "Comalcalco"],
        "Tamaulipas": ["Ciudad Victoria", "Tampico", "Reynosa", "Matamoros", "Nuevo Laredo"],
        "Tlaxcala": ["Tlaxcala", "Apizaco", "Huamantla"],
        "Veracruz": ["Xalapa", "Veracruz", "Coatzacoalcos", "Poza Rica", "Córdoba", "Orizaba"],
        "Yucatán": ["Mérida", "Progreso", "Valladolid"],
        "Zacatecas": ["Zacatecas", "Fresnillo", "Guadalupe"]
    },
    "Nicaragua": {
        "Boaco": ["Boaco", "Camoapa", "San José de los Remates"],
        "Carazo": ["Jinotepe", "Diriamba", "San Marcos", "Dolores"],
        "Chinandega": ["Chinandega", "El Viejo", "Corinto", "Chichigalpa"],
        "Chontales": ["Juigalpa", "Acoyapa", "Santo Tomás"],
        "Costa Caribe Norte": ["Puerto Cabezas (Bilwi)", "Waspán", "Siuna"],
        "Costa Caribe Sur": ["Bluefields", "Kukra Hill", "Laguna de Perlas"],
        "Estelí": ["Estelí", "Condega", "Pueblo Nuevo"],
        "Granada": ["Granada", "Nandaime", "Diriomo"],
        "Jinotega": ["Jinotega", "San Rafael del Norte", "La Concordia"],
        "León": ["León", "La Paz Centro", "Nagarote", "Telica"],
        "Madriz": ["Somoto", "Telpaneca", "San Juan del Río Coco"],
        "Managua": ["Managua", "Ciudad Sandino", "Ticuantepe", "El Crucero"],
        "Masaya": ["Masaya", "Nindirí", "Tisma", "La Concepción"],
        "Matagalpa": ["Matagalpa", "Sébaco", "Ciudad Darío", "Río Blanco"],
        "Nueva Segovia": ["Ocotal", "Jalapa", "Quilalí"],
        "Río San Juan": ["San Carlos", "San Miguelito", "El Castillo"],
        "Rivas": ["Rivas", "San Juan del Sur", "Tola", "Belén"]
    },
    "Panamá": {
        "Bocas del Toro": ["Bocas del Toro", "Changuinola", "Almirante"],
        "Chiriquí": ["David", "Boquete", "Volcán", "Bugaba"],
        "Coclé": ["Penonomé", "Aguadulce", "Antón"],
        "Colón": ["Colón", "Portobelo", "Sabanitas"],
        "Darién": ["La Palma", "Yaviza", "El Real de Santa María"],
        "Emberá-Wounaan": ["Unión Chocó", "Cémaco"],
        "Guna Yala": ["El Porvenir", "Cartí Sugdupu", "Ailigandí"],
        "Herrera": ["Chitré", "Ocú", "Parita", "Pesé"],
        "Los Santos": ["Las Tablas", "Guararé", "Pedasí", "Tonosí"],
        "Ngäbe-Buglé": ["Llano Tugrí", "Kankintú", "Besikó"],
        "Panamá": ["Ciudad de Panamá", "San Miguelito", "Tocumen", "Chepo"],
        "Panamá Oeste": ["La Chorrera", "Arraiján", "Capira", "Chame"],
        "Veraguas": ["Santiago de Veraguas", "Soná", "Cañazas", "Atalaya"]
    },
    "Paraguay": {
        "Alto Paraguay": ["Fuerte Olimpo", "Bahía Negra"],
        "Alto Paraná": ["Ciudad del Este", "Hernandarias", "Presidente Franco", "Minga Guazú"],
        "Amambay": ["Pedro Juan Caballero", "Capitán Bado"],
        "Asunción": ["Asunción"],
        "Boquerón": ["Filadelfia", "Loma Plata", "Mariscal Estigarribia"],
        "Caaguazú": ["Coronel Oviedo", "Caaguazú", "Yhú"],
        "Caazapá": ["Caazapá", "Yuty", "San Juan Nepomuceno"],
        "Canindeyú": ["Salto del Guairá", "Curuguaty", "Katueté"],
        "Central": ["Areguá", "Luque", "San Lorenzo", "Capiatá", "Lambaré", "Fernando de la Mora", "Limpio", "Ñemby", "Mariano Roque Alonso", "Itauguá", "Villa Elisa"],
        "Concepción": ["Concepción", "Horqueta", "Yby Yaú"],
        "Cordillera": ["Caacupé", "Tobatí", "Piribebuy", "Eusebio Ayala"],
        "Guairá": ["Villarrica", "Independencia", "Mbocayaty"],
        "Itapúa": ["Encarnación", "Coronel Bogado", "Hohenau"],
        "Misiones": ["San Juan Bautista", "San Ignacio Guazú", "Ayolas"],
        "Ñeembucú": ["Pilar", "Humaitá", "Paso de Patria"],
        "Paraguarí": ["Paraguarí", "Yaguarón", "Carapeguá"],
        "Presidente Hayes": ["Villa Hayes", "Benjamín Aceval"],
        "San Pedro": ["San Pedro de Ycuamandiyú", "San Estanislao", "Guayaibí"]
    },
    "Perú": {
        "Amazonas": ["Chachapoyas", "Bagua Grande", "Lamud"],
        "Áncash": ["Huaraz", "Chimbote", "Caraz", "Huari"],
        "Apurímac": ["Abancay", "Andahuaylas", "Chincheros"],
        "Arequipa": ["Arequipa", "Camaná", "Mollendo", "Caylloma"],
        "Ayacucho": ["Ayacucho", "Huanta", "Puquio"],
        "Cajamarca": ["Cajamarca", "Jaén", "Chota", "Cutervo"],
        "Callao": ["Callao", "Ventanilla", "Bellavista"],
        "Cusco": ["Cusco", "Sicuani", "Urubamba", "Quillabamba"],
        "Huancavelica": ["Huancavelica", "Lircay", "Pampas"],
        "Huánuco": ["Huánuco", "Tingo María", "Ambo"],
        "Ica": ["Ica", "Chincha Alta", "Pisco", "Nazca"],
        "Junín": ["Huancayo", "Tarma", "Jauja", "La Oroya"],
        "La Libertad": ["Trujillo", "Chepén", "Pacasmayo", "Huamachuco"],
        "Lambayeque": ["Chiclayo", "Lambayeque", "Ferreñafe"],
        "Lima": ["Lima", "Huacho", "Barranca", "Huaral", "Cañete"],
        "Loreto": ["Iquitos", "Nauta", "Yurimaguas"],
        "Madre de Dios": ["Puerto Maldonado", "Iñapari", "Salvación"],
        "Moquegua": ["Moquegua", "Ilo", "Omate"],
        "Pasco": ["Cerro de Pasco", "Oxapampa", "Yanahuanca"],
        "Piura": ["Piura", "Sullana", "Talara", "Paita", "Chulucanas"],
        "Puno": ["Puno", "Juliaca", "Azángaro", "Ilave"],
        "San Martín": ["Moyobamba", "Tarapoto", "Juanjuí", "Rioja"],
        "Tacna": ["Tacna", "Locumba", "Tarata"],
        "Tumbes": ["Tumbes", "Zarumilla", "Contralmirante Villar"],
        "Ucayali": ["Pucallpa", "Aguaytía", "Atalaya"]
    },
    "Puerto Rico": {
        "Adjuntas": ["Adjuntas"],
        "Aguada": ["Aguada"],
        "Aguadilla": ["Aguadilla"],
        "Aguas Buenas": ["Aguas Buenas"],
        "Aibonito": ["Aibonito"],
        "Arecibo": ["Arecibo", "Hatillo", "Camuy"],
        "Bayamón": ["Bayamón", "Toa Alta", "Naranjito"],
        "Caguas": ["Caguas", "San Lorenzo", "Aguas Buenas"],
        "Carolina": ["Carolina", "Trujillo Alto", "Canóvanas"],
        "Cataño": ["Cataño"],
        "Cayey": ["Cayey", "Cidra", "Aibonito"],
        "Cidra": ["Cidra"],
        "Fajardo": ["Fajardo", "Luquillo", "Ceiba"],
        "Guayama": ["Guayama", "Salinas", "Arroyo"],
        "Guaynabo": ["Guaynabo"],
        "Gurabo": ["Gurabo"],
        "Humacao": ["Humacao", "Naguabo", "Yabucoa"],
        "Mayagüez": ["Mayagüez", "Cabo Rojo", "Hormigueros"],
        "Ponce": ["Ponce", "Juana Díaz", "Villalba"],
        "San Juan": ["San Juan", "Guaynabo", "Trujillo Alto"],
        "Toa Baja": ["Toa Baja", "Dorado", "Vega Alta"],
        "Trujillo Alto": ["Trujillo Alto"],
        "Vega Baja": ["Vega Baja", "Manatí", "Morovis"]
    },
    "República Dominicana": {
        "Azua": ["Azua de Compostela", "Padre Las Casas"],
        "Bahoruco": ["Neiba", "Villa Jaragua"],
        "Barahona": ["Santa Cruz de Barahona", "Cabral", "Vicente Noble"],
        "Dajabón": ["Dajabón", "Loma de Cabrera"],
        "Distrito Nacional": ["Santo Domingo"],
        "Duarte": ["San Francisco de Macorís", "Pimentel", "Villa Riva"],
        "El Seibo": ["Santa Cruz del Seibo", "Miches"],
        "Elías Piña": ["Comendador", "Bánica"],
        "Espaillat": ["Moca", "Gaspar Hernández", "Cayetano Germosén"],
        "Hato Mayor": ["Hato Mayor del Rey", "Sabana de la Mar"],
        "Hermanas Mirabal": ["Salcedo", "Tenares", "Villa Tapia"],
        "Independencia": ["Jimaní", "Duvergé"],
        "La Altagracia": ["Salvaleón de Higüey", "Punta Cana", "Bávaro"],
        "La Romana": ["La Romana", "Guaymate"],
        "La Vega": ["Concepción de La Vega", "Jarabacoa", "Constanza"],
        "María Trinidad Sánchez": ["Nagua", "Cabrera", "Río San Juan"],
        "Monseñor Nouel": ["Bonao", "Maimón", "Piedra Blanca"],
        "Monte Cristi": ["San Fernando de Monte Cristi", "Villa Vásquez", "Castañuelas"],
        "Monte Plata": ["Monte Plata", "Yamasá", "Sabana Grande de Boyá"],
        "Pedernales": ["Pedernales", "Oviedo"],
        "Peravia": ["Baní", "Nizao"],
        "Puerto Plata": ["San Felipe de Puerto Plata", "Sosúa", "Cabarete", "Luperón"],
        "Samaná": ["Santa Bárbara de Samaná", "Las Terrenas"],
        "San Cristóbal": ["San Cristóbal", "Bajos de Haina", "Villa Altagracia"],
        "San José de Ocoa": ["San José de Ocoa", "Sabana Larga"],
        "San Juan": ["San Juan de la Maguana", "Las Matas de Farfán"],
        "San Pedro de Macorís": ["San Pedro de Macorís", "Consuelo", "Quisqueya"],
        "Sánchez Ramírez": ["Cotuí", "Cevicos", "Fantino"],
        "Santiago": ["Santiago de los Caballeros", "Villa González", "Licey al Medio"],
        "Santiago Rodríguez": ["Sabaneta", "Monción"],
        "Santo Domingo": ["Santo Domingo Este", "Santo Domingo Norte", "Santo Domingo Oeste", "Boca Chica"],
        "Valverde": ["Mao", "Esperanza", "Laguna Salada"]
    },
    "Uruguay": {
        "Artigas": ["Artigas", "Bella Unión"],
        "Canelones": ["Canelones", "Ciudad de la Costa", "Las Piedras", "Pando", "La Paz"],
        "Cerro Largo": ["Melo", "Río Branco"],
        "Colonia": ["Colonia del Sacramento", "Carmelo", "Juan Lacaze"],
        "Durazno": ["Durazno", "Sarandí del Yí"],
        "Flores": ["Trinidad", "Ismael Cortinas"],
        "Florida": ["Florida", "Sarandí Grande"],
        "Lavalleja": ["Minas", "José Pedro Varela"],
        "Maldonado": ["Maldonado", "Punta del Este", "San Carlos", "Piriápolis"],
        "Montevideo": ["Montevideo"],
        "Paysandú": ["Paysandú", "Guichón"],
        "Río Negro": ["Fray Bentos", "Young"],
        "Rivera": ["Rivera", "Tranqueras"],
        "Rocha": ["Rocha", "Chuy", "La Paloma"],
        "Salto": ["Salto", "Daymán"],
        "San José": ["San José de Mayo", "Ciudad del Plata"],
        "Soriano": ["Mercedes", "Dolores", "Cardona"],
        "Tacuarembó": ["Tacuarembó", "Paso de los Toros"],
        "Treinta y Tres": ["Treinta y Tres", "Vergara"]
    },
    "Venezuela": {
        "Amazonas": ["Puerto Ayacucho"],
        "Anzoátegui": ["Barcelona", "Puerto La Cruz", "Lechería", "El Tigre"],
        "Apure": ["San Fernando de Apure", "Guasdualito"],
        "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua"],
        "Barinas": ["Barinas", "Socopó", "Santa Bárbara"],
        "Bolívar": ["Ciudad Bolívar", "Ciudad Guayana (Puerto Ordaz)", "Upata"],
        "Carabobo": ["Valencia", "Naguanagua", "Puerto Cabello", "Guacara"],
        "Cojedes": ["San Carlos", "Tinaquillo"],
        "Delta Amacuro": ["Tucupita"],
        "Distrito Capital": ["Caracas"],
        "Falcón": ["Coro", "Punto Fijo", "Tucacas"],
        "Guárico": ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"],
        "Lara": ["Barquisimeto", "Cabudare", "Carora", "El Tocuyo"],
        "Mérida": ["Mérida", "Ejido", "El Vigía"],
        "Miranda": ["Los Teques", "Petare", "Guarenas", "Guatire", "Baruta", "Chacao", "El Hatillo"],
        "Monagas": ["Maturín", "Punta de Mata"],
        "Nueva Esparta": ["La Asunción", "Porlamar", "Pampatar"],
        "Portuguesa": ["Guanare", "Acarigua", "Araure"],
        "Sucre": ["Cumaná", "Carúpano", "Güiria"],
        "Táchira": ["San Cristóbal", "Táriba", "La Grita"],
        "Trujillo": ["Trujillo", "Valera", "Boconó"],
        "Vargas (La Guaira)": ["La Guaira", "Catia La Mar", "Maiquetía"],
        "Yaracuy": ["San Felipe", "Yaritagua", "Chivacoa"],
        "Zulia": ["Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda"]
    }
};
// --- End Location Data ---

// --- Country Specific Data ---
const countrySpecificData: Record<string, {
    idName: string,
    idRegex: RegExp,
    idError: string,
    educationLevels: {
        primary: string,
        secondary: string,
        university: string,
    }
}> = {
    "Argentina": { idName: "DNI", idRegex: /^\d{8}$/, idError: "El DNI debe tener 8 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Polimodal", university: "Universidad / Facultad" } },
    "México": { idName: "CURP", idRegex: /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/i, idError: "El CURP debe ser de 18 caracteres y tener un formato válido.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Preparatoria", university: "Universidad" } },
    "Chile": { idName: "RUT", idRegex: /^\d{7,8}-[\dKk]$/, idError: "El RUT debe tener 7-8 dígitos más un dígito verificador.", educationLevels: { primary: "Básica", secondary: "Media", university: "Universidad" } },
    "Colombia": { idName: "Cédula de ciudadanía", idRegex: /^\d{6,10}$/, idError: "La Cédula debe tener entre 6 y 10 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Bachillerato", university: "Universidad" } },
    "Perú": { idName: "DNI", idRegex: /^\d{8}$/, idError: "El DNI debe tener 8 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria", university: "Universidad" } },
    "España": { idName: "DNI", idRegex: /^\d{8}[A-HJ-NP-TV-Z]$/i, idError: "El DNI debe tener 8 dígitos y una letra.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Bachillerato", university: "Universidad" } },
    "Uruguay": { idName: "Cédula de identidad", idRegex: /^\d{7,8}$/, idError: "La Cédula debe tener 7 u 8 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Ciclo Básico y Bachillerato", university: "Universidad" } },
    "Venezuela": { idName: "Cédula de identidad", idRegex: /^\d{6,8}$/, idError: "La Cédula debe tener entre 6 y 8 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Bachillerato", university: "Universidad" } },
    "Bolivia": { idName: "Cédula de identidad", idRegex: /^\d{7,8}$/, idError: "La Cédula debe tener 7 u 8 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria", university: "Universidad" } },
    "Ecuador": { idName: "Cédula de identidad", idRegex: /^\d{10}$/, idError: "La Cédula debe tener 10 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria", university: "Universidad" } },
    "Paraguay": { idName: "Cédula de identidad", idRegex: /^\d{7,9}$/, idError: "La Cédula debe tener entre 7 y 9 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Bachillerato", university: "Universidad" } },
    "Guatemala": { idName: "DPI", idRegex: /^\d{13}$/, idError: "El DPI debe tener 13 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Diversificado", university: "Universidad" } },
    "Honduras": { idName: "Identidad", idRegex: /^\d{13}$/, idError: "La Identidad debe tener 13 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Diversificado", university: "Universidad" } },
    "El Salvador": { idName: "DUI", idRegex: /^\d{9}$/, idError: "El DUI debe tener 9 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria", university: "Universidad" } },
    "Nicaragua": { idName: "Cédula", idRegex: /^\d{13}$/, idError: "La Cédula debe tener 13 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Diversificado", university: "Universidad" } },
    "Costa Rica": { idName: "Cédula", idRegex: /^\d{9}$/, idError: "La Cédula debe tener 9 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Diversificado", university: "Universidad" } },
    "Panamá": { idName: "Cédula", idRegex: /^\d{8,9}$/, idError: "La Cédula debe tener 8 o 9 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria", university: "Universidad" } },
    "República Dominicana": { idName: "Cédula", idRegex: /^\d{11}$/, idError: "La Cédula debe tener 11 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Bachillerato", university: "Universidad" } },
    "Cuba": { idName: "Carné de identidad", idRegex: /^\d{11}$/, idError: "El Carné debe tener 11 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria", university: "Universidad" } },
    "Puerto Rico": { idName: "Licencia de Conducir", idRegex: /^\d{9}$/, idError: "La Licencia debe tener 9 dígitos.", educationLevels: { primary: "Primaria", secondary: "Secundaria / Superior", university: "Universidad" } },
};
// --- End Country Specific Data ---

type CenterInfo = {
    id: string;
    name: string;
    animal: any;
    color: string;
    href: string;
};

const createCenterBaseSchema = z.object({
  centerName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  schoolName: z.string().min(3, { message: 'El nombre del colegio debe tener al menos 3 caracteres.' }),
  country: z.string({ required_error: 'Debes seleccionar un país.' }),
  province: z.string({ required_error: 'Debes seleccionar una provincia.' }),
  district: z.string({ required_error: 'Debes seleccionar un distrito.' }),
  animal: z.string({ required_error: 'Por favor, selecciona un animal.' }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { message: 'Color inválido.' }),
  nationalId: z.string().min(1, "El documento es requerido."),
  educationLevel: z.string({ required_error: 'Debes seleccionar un nivel educativo.' }),
  courses: z.array(z.object({ value: z.string().min(1, { message: 'El nombre del curso no puede estar vacío.' }) })).min(1, { message: 'Debes agregar al menos un curso.' }),
});

const createCenterSchema = createCenterBaseSchema.refine(data => {
    if (!data.country) return true; // Let the required validation handle this
    const countryData = countrySpecificData[data.country];
    if (!countryData) return false;
    return countryData.idRegex.test(data.nationalId);
}, data => {
    const countryData = countrySpecificData[data.country];
    return {
        message: countryData?.idError || "Formato de documento inválido.",
        path: ['nationalId'],
    };
});


type JoinCenterSchemaType = z.infer<ReturnType<typeof getJoinCenterSchema>>;

// We need a function to create the schema dynamically based on the verified center's country
const getJoinCenterSchema = (country?: string | null) => {
    let schema = z.object({
        inviteCode: z.string().min(1, { message: 'El código de invitación es requerido.' }),
        firstName: z.string().min(2, { message: 'El nombre es requerido.' }),
        lastName: z.string().min(2, { message: 'El apellido es requerido.' }),
        nationalId: z.string().min(1, { message: 'El documento es requerido.' }),
        course: z.string({ required_error: 'Debes seleccionar un curso.' }),
    });

    if (country && countrySpecificData[country]) {
        const countryData = countrySpecificData[country];
        return schema.refine(data => countryData.idRegex.test(data.nationalId), {
            message: countryData.idError,
            path: ['nationalId'],
        });
    }

    return schema;
}

type Screen = 'welcome' | 'create' | 'join';

function generateSecureCode() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export default function WelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [userCenters, setUserCenters] = useState<CenterInfo[]>([]);

  // State for joining a center
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedCenter, setVerifiedCenter] = useState<{name: string, courses: string[], country: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.studentCenterIds && userData.studentCenterIds.length > 0) {
                    const centersQuery = query(collection(db, 'student_centers'), where('__name__', 'in', userData.studentCenterIds));
                    const centersSnapshot = await getDocs(centersQuery);
                    const centersData = centersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().centerName,
                        animal: doc.data().animal,
                        color: doc.data().color,
                        href: `/home?centerId=${doc.id}`
                    } as CenterInfo));
                    setUserCenters(centersData);
                }
            }
        }
    });
    return () => unsubscribe();
  }, []);

  const createForm = useForm<z.infer<typeof createCenterSchema>>({
    resolver: zodResolver(createCenterSchema),
    defaultValues: {
      centerName: '',
      schoolName: '',
      color: '#2563eb',
      nationalId: '',
      courses: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: 'courses',
  });

  const joinForm = useForm<JoinCenterSchemaType>({
    resolver: zodResolver(getJoinCenterSchema(verifiedCenter?.country)),
    defaultValues: {
      inviteCode: '',
      firstName: '',
      lastName: '',
      nationalId: '',
    },
  });
  
  // Location selection logic
  const selectedCountry = createForm.watch('country');
  const selectedProvince = createForm.watch('province');
  
  const countries = Object.keys(locationData);
  const provinces = selectedCountry ? Object.keys(locationData[selectedCountry as keyof typeof locationData]) : [];
  const districts = selectedCountry && selectedProvince && locationData[selectedCountry as keyof typeof locationData]?.[selectedProvince as keyof typeof locationData[keyof typeof locationData]] ? locationData[selectedCountry as keyof typeof locationData][selectedProvince as keyof typeof locationData[keyof typeof locationData]] : [];
  const currentCountryData = selectedCountry ? countrySpecificData[selectedCountry] : null;

  useEffect(() => {
    createForm.resetField('province');
    createForm.resetField('district');
    createForm.resetField('educationLevel');
  }, [selectedCountry, createForm]);

  useEffect(() => {
    createForm.resetField('district');
  }, [selectedProvince, createForm]);


  const selectedAnimal = createForm.watch('animal');
  const selectedColor = createForm.watch('color');

  const handleCreateCenter = async (values: z.infer<typeof createCenterSchema>) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast({ title: "Error de autenticación", description: "Por favor, inicia sesión de nuevo.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const fullLocation = `${values.country}, ${values.province}, ${values.district}`;
        const { country, province, district, ...restOfValues } = values;
        
        const centerData = { 
            ...restOfValues, 
            location: fullLocation,
            locationDetails: { country, province, district },
            roles: {
                owner: user.uid,
                adminPlus: [],
                admin: [],
                student: [],
            },
            courses: values.courses.map(c => c.value), 
            createdAt: serverTimestamp() 
        };

        const centerRef = await addDoc(collection(db, 'student_centers'), centerData);

        const studentCode = generateSecureCode();
        const adminCode = generateSecureCode();
        
        const invitationCodesRef = collection(db, 'student_centers', centerRef.id, 'invitation_codes');
        await setDoc(doc(invitationCodesRef, 'student'), { code: studentCode, role: 'Alumno', createdAt: serverTimestamp() });
        await setDoc(doc(invitationCodesRef, 'admin'), { code: adminCode, role: 'Admin', createdAt: serverTimestamp() });

        const userDocRef = doc(db, 'users', user.uid);
        
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("User document does not exist!");
            }
            transaction.update(userDocRef, { 
                studentCenterIds: arrayUnion(centerRef.id), 
                dni: values.nationalId 
            });
        });

        toast({ title: '¡Centro de Estudiantes Creado!', description: `Bienvenido a ${values.centerName}. Ahora eres el propietario.` });
        router.push(`/home?centerId=${centerRef.id}`);
    } catch (error) {
        console.error("Error creating center: ", error);
        toast({ title: "Error al crear el centro", description: "No se pudo guardar la información. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
      const inviteCode = joinForm.getValues("inviteCode");
      if (!inviteCode) {
          joinForm.setError("inviteCode", { message: "El código no puede estar vacío."});
          return;
      }
      setIsVerifyingCode(true);
      setVerifiedCenter(null);
      joinForm.clearErrors("inviteCode");

      const result = await getCenterCoursesByCode(inviteCode);
      if (result.success && result.data) {
          setVerifiedCenter(result.data);
          joinForm.trigger('nationalId'); 
          toast({ title: "Código Válido", description: `Te estás uniendo a: ${result.data.name}`});
      } else {
          joinForm.setError("inviteCode", { message: result.message });
      }
      setIsVerifyingCode(false);
  }

  const handleJoinCenter = async (values: JoinCenterSchemaType) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast({ title: "Error de autenticación", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const { nationalId, ...restOfValues } = values;
    
    const result = await joinCenterWithCode({
        userId: user.uid,
        ...restOfValues,
        dni: nationalId // Map nationalId to dni for the action
    });

    if (result.success) {
        toast({ title: "¡Te has unido al Centro!", description: result.message });
        router.push(`/home?centerId=${result.centerId}`);
    } else {
        toast({ title: "Error al unirse", description: result.message, variant: "destructive" });
    }
    
    setIsLoading(false);
  };

  const motionVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };
  
  const currentJoinCountryData = verifiedCenter?.country ? countrySpecificData[verifiedCenter.country] : null;


  return (
      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
            <motion.div key="welcome" variants={motionVariants} initial="hidden" animate="visible" exit="exit" className="w-full space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-2xl font-headline">Mis Centros</CardTitle><CardDescription>Selecciona un centro para acceder o crea uno nuevo.</CardDescription></CardHeader>
                <CardContent>
                  {userCenters.length > 0 ? (
                    <div className="space-y-3">{userCenters.map((center, index) => (<CenterCard key={index} {...center} />))}</div>
                  ) : (<p className="text-sm text-muted-foreground text-center py-4">Aún no te has unido a ningún centro todavía.</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-headline">¿No está tu centro?</CardTitle><CardDescription>Crea un nuevo centro o únete a uno existente con un código.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                     <Button size="lg" className="w-full" onClick={() => setScreen('create')}><Building className="mr-2 h-5 w-5" />Crear un Centro de Estudiantes</Button>
                    <Button size="lg" variant="secondary" className="w-full" onClick={() => setScreen('join')}><UserPlus className="mr-2 h-5 w-5" />Unirme a un Centro</Button>
                </CardContent>
             </Card>
            </motion.div>
        )}

        {screen === 'create' && (
            <motion.div key="create" variants={motionVariants} initial="hidden" animate="visible" exit="exit">
              <Card>
                <CardHeader><CardTitle className="text-2xl font-headline">Crear un Nuevo Centro</CardTitle><CardDescription>Completa los detalles para configurar tu centro.</CardDescription></CardHeader>
                <CardContent>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateCenter)} className="space-y-4">
                      <FormField control={createForm.control} name="centerName" render={({ field }) => (<FormItem><FormLabel>Nombre del Centro</FormLabel><FormControl><Input placeholder="Ej: Centro de Estudiantes 'Los Pioneros'" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={createForm.control} name="schoolName" render={({ field }) => (<FormItem><FormLabel>Nombre del Colegio</FormLabel><FormControl><Input placeholder="Ej: Colegio San Martín" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={createForm.control} name="country" render={({ field }) => (<FormItem><FormLabel>País</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona País" /></SelectTrigger></FormControl><SelectContent>{countries.map(country => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={createForm.control} name="province" render={({ field }) => (<FormItem><FormLabel>Provincia / Estado</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona Provincia" /></SelectTrigger></FormControl><SelectContent>{provinces.map(province => <SelectItem key={province} value={province}>{province}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={createForm.control} name="district" render={({ field }) => (<FormItem><FormLabel>Distrito / Ciudad</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedProvince}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona Distrito" /></SelectTrigger></FormControl><SelectContent>{districts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      </div>
                      
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField 
                                control={createForm.control} 
                                name="nationalId" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{currentCountryData?.idName || 'Documento Nacional'}</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder={currentCountryData?.idError || "Tu número de documento"}
                                                {...field} 
                                                disabled={!selectedCountry}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                             <FormField 
                                control={createForm.control} 
                                name="educationLevel" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nivel Educativo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona Nivel" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {currentCountryData && Object.entries(currentCountryData.educationLevels).map(([key, value]) => (
                                                    <SelectItem key={key} value={value}>{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                        </div>


                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={createForm.control} name="animal" render={({ field }) => (<FormItem><FormLabel>Animal Representativo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl><SelectContent>{animals.map(animal => <SelectItem key={animal} value={animal}><div className="flex items-center gap-2"><AnimalLogo animal={animal} className="w-5 h-5"/>{animal}</div></SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={createForm.control} name="color" render={({ field }) => (<FormItem><FormLabel>Color Principal</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="color" {...field} className="w-16 p-1" /></FormControl>{selectedAnimal && (<div className="p-2 rounded-md border" style={{ backgroundColor: selectedColor, color: 'white' }}><AnimalLogo animal={selectedAnimal as any} className="w-6 h-6" /></div>)}</div><FormMessage /></FormItem>)} />
                      </div>

                      <div className="space-y-2">
                          <FormLabel>Cursos del Colegio</FormLabel><p className="text-sm text-muted-foreground">Añade todos los cursos. El primero será tu curso.</p>
                          {fields.map((field, index) => (<FormField key={field.id} control={createForm.control} name={`courses.${index}.value`} render={({ field }) => (<FormItem><div className="flex items-center gap-2"><FormControl><Input {...field} placeholder={`Ej: 5to A`} /></FormControl><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button></div><FormMessage /></FormItem>)} />))}
                          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Añadir Curso</Button>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button type="button" variant="secondary" className="w-full" onClick={() => setScreen('welcome')}>Atrás</Button>
                        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear Centro y Continuar</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
        )}

        {screen === 'join' && (
            <motion.div key="join" variants={motionVariants} initial="hidden" animate="visible" exit="exit">
              <Card>
                <CardHeader><CardTitle className="text-2xl font-headline">Unirse a un Centro</CardTitle><CardDescription>Ingresa tu código de invitación para empezar.</CardDescription></CardHeader>
                <CardContent>
                  <Form {...joinForm}>
                    <form onSubmit={joinForm.handleSubmit(handleJoinCenter)} className="space-y-4">
                      <FormField control={joinForm.control} name="inviteCode" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Código de Invitación</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder="Pega el código aquí" 
                                    {...field}
                                    onBlur={handleVerifyCode} 
                                    disabled={isVerifyingCode || !!verifiedCenter}
                                  />
                                </FormControl>
                                {isVerifyingCode && <Loader2 className="h-5 w-5 animate-spin" />}
                              </div>
                              <FormMessage />
                          </FormItem>
                      )} />
                      
                      <AnimatePresence>
                        {verifiedCenter && (
                           <motion.div 
                              key="join-details"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4 overflow-hidden"
                            >
                                <FormField control={joinForm.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre real" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={joinForm.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Tu apellido real" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField 
                                    control={joinForm.control} 
                                    name="nationalId" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{currentJoinCountryData?.idName || 'Documento Nacional'}</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder={currentJoinCountryData?.idError || "Tu número de documento"}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                                <FormField control={joinForm.control} name="course" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Curso</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona tu curso" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {verifiedCenter.courses.map((course) => (
                                                    <SelectItem key={course} value={course}>{course}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                           </motion.div>
                        )}
                      </AnimatePresence>

                       <div className="flex gap-4 pt-4">
                          <Button type="button" variant="secondary" className="w-full" onClick={() => { setScreen('welcome'); setVerifiedCenter(null); joinForm.reset(); }}>Atrás</Button>
                          <Button type="submit" className="w-full" disabled={isLoading || !verifiedCenter}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Unirse al Centro</Button>
                       </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
        )}
      </AnimatePresence>
  );
}
