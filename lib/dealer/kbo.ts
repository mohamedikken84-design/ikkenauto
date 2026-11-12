/** Belgian enterprise / VAT number normalization. No claim of a live official KBO lookup. */
export type KboCheck = {valid:true;normalized:string;formatted:string}|{valid:false;normalized:"";formatted:"";error:string};
export function parseBelgianEnterpriseNumber(input:string):KboCheck{
 const cleaned=(input||"").trim().toUpperCase().replace(/^BE[\s.:_-]*/,"");
 if(!/^[\d\s.\/-]+$/.test(cleaned))return {valid:false,normalized:"",formatted:"",error:"Gebruik een Belgisch ondernemingsnummer, bijvoorbeeld BE 0123.456.749."};
 let digits=cleaned.replace(/\D/g,"");
 if(digits.length===9)digits="0"+digits;
 if(digits.length!==10)return {valid:false,normalized:"",formatted:"",error:"Een ondernemingsnummer bestaat uit 10 cijfers."};
 if(!/^[01]/.test(digits))return {valid:false,normalized:"",formatted:"",error:"Een Belgisch ondernemingsnummer begint met 0 of 1."};
 const control=Number(digits.slice(-2)),value=Number(digits.slice(0,8));
 if(97-value%97!==control)return {valid:false,normalized:"",formatted:"",error:"Dit ondernemingsnummer voldoet niet aan de Belgische controleberekening."};
 return {valid:true,normalized:digits,formatted:"BE "+digits.slice(0,4)+"."+digits.slice(4,7)+"."+digits.slice(7)};
}
