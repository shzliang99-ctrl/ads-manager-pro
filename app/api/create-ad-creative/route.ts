import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ១. នៅក្នុងប្រព័ន្ធពិតប្រាកដ បងត្រូវរៀបចំកូដ Save ទិន្នន័យ (body) នេះចូលទៅក្នុង Database របស់បង
    console.log("✅ ទិន្នន័យ Conversation ដែលបាន Save ទុកក្នុងប្រព័ន្ធត្រៀមសម្រាប់ Publish:", body);

    // ២. បញ្ឆោតប្រព័ន្ធឱ្យរង់ចាំ 1 វិនាទី ដើម្បីឱ្យចេញសញ្ញា Loading វិលៗស្អាត ដូចកំពុង Save ចូល Database 
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ៣. ប្រគល់លទ្ធផលជោគជ័យត្រលប់ទៅកាន់ UI វិញភ្លាមៗ
    return NextResponse.json({ 
        success: true, 
        message: "ជោគជ័យ! ទិន្នន័យ Conversation ត្រូវបាន Save ទុកក្នុងប្រព័ន្ធត្រៀមសម្រាប់ Publish ជាមួយ Ad។" 
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}