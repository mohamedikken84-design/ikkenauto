import {NextResponse,connection} from "next/server";
import {createSupabaseServer} from "@/lib/supabase/server";

export async function GET(request:Request){
 await connection();
 const url=new URL(request.url);
 // Avoid letting user input inject PostgREST .or() expressions.
 const q=(url.searchParams.get("q")||"").trim().slice(0,80).replace(/[^\p{L}\p{N}\s-]/gu,"").trim();
 if(q.length<2)return NextResponse.json({companies:[]},{headers:{"Cache-Control":"no-store"}});
 const db=await createSupabaseServer();
 const {data,error}=await db.from("portal_directory")
  .select("source_row,name,city,address,website")
  .or("name.ilike.%"+q+"%,city.ilike.%"+q+"%")
  .order("name",{ascending:true})
  .limit(12);
 if(error)return NextResponse.json({companies:[],error:"search_unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({companies:data||[]},{headers:{"Cache-Control":"no-store"}});
}
