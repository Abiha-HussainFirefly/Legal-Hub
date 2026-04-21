// app/api/answers/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { prisma } from '@/lib/prisma';
import { createComment } from '@/lib/services/discussion.service';
type P = { params: Promise<{ id: string }> };
const A = { id:true,displayName:true,avatarUrl:true,profile:{select:{username:true,isLawyer:true}},lawyerProfile:{select:{verificationStatus:true,barCouncil:true,firmName:true}} };
export async function GET(req: NextRequest, { params }: P) {
  try {
    const { id: answerId } = await params;
    const sp=new URL(req.url).searchParams, page=Math.max(1,parseInt(sp.get('page')||'1')), limit=Math.min(50,parseInt(sp.get('limit')||'20')), skip=(page-1)*limit;
    const [total,data]=await prisma.$transaction([
      prisma.comment.count({where:{answerId,parentId:null,status:'ACTIVE'}}),
      prisma.comment.findMany({where:{answerId,parentId:null,status:'ACTIVE'},skip,take:limit,orderBy:{createdAt:'asc'},
        include:{author:{select:A},replies:{where:{status:'ACTIVE'},take:3,orderBy:{createdAt:'asc'},include:{author:{select:A}}}}}),
    ]);
    return NextResponse.json({data,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}});
  } catch(e:any){return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id: answerId } = await params;
    const user=await getSessionUser(req);
    if (!user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});
    const {body,parentId}=await req.json();
    if (!body?.trim()) return NextResponse.json({error:'Body required'},{status:400});
    return NextResponse.json(await createComment(user.id,undefined,answerId,parentId,{body}),{status:201});
  } catch(e:any){return NextResponse.json({error:e.message},{status:400});}
}