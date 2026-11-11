import {NextResponse} from "next/server";
import {createSupabaseServer} from "@/lib/supabase/server";
export async function GET(request:Request){
 const url=new URL(request.url),q=(url.searchParams.get("q")||"").trim().slice(0,100).replace(/[%_,()]/g,"");
 if(q.length<2)return NextResponse.json({companies:[]});
 const db=await createSupabaseServer();
 const {data,error}=await db.from("portal_directory").select("source_row,name,city,address,website").ilike("name","%"+q+"%").limit(12);
 if(error)return NextResponse.json({companies:[],error:"search_unavailable"},{status:503});
 return NextResponse.json({companies:data||[]},{headers:{"Cache-Control":"no-store"}});
}