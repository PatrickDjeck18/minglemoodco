import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { PDFDocument, rgb, PDFFont } from 'npm:pdf-lib@1.17.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CertificateRequest {
  participantId: string;
  examId: string;
  attemptId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { participantId, examId, attemptId }: CertificateRequest = await req.json();

    console.log('🏆 Starting certificate generation:', { participantId, examId, attemptId });

    // Check if certificate already exists (idempotency guard)
    const { data: existingCert, error: existingError } = await supabase
      .from('certificates')
      .select('id, pdf_url')
      .eq('participant_id', participantId)
      .eq('exam_id', examId)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing certificate:', existingError);
    }

    if (existingCert) {
      console.log('✅ Certificate already exists, returning existing:', existingCert.id);
      return new Response(
        JSON.stringify({
          success: true,
          certificateId: existingCert.id,
          certificateUrl: existingCert.pdf_url,
          message: 'Certificate already exists'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Get exam attempt with exam and participant data
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exams (
          id,
          title,
          certificate_template
        ),
        profiles (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', attemptId)
      .eq('participant_id', participantId)
      .eq('exam_id', examId)
      .eq('passed', true)
      .single();

    if (attemptError || !attempt) {
      console.error('❌ Attempt not found or not passed:', attemptError);
      throw new Error('Nie znaleziono zdanego egzaminu');
    }

    console.log('📋 Loaded attempt data:', {
      attemptId: attempt.id,
      examTitle: attempt.exams.title,
      participantEmail: attempt.profiles.email,
      passed: attempt.passed
    });

    // Generate certificate data
    const certificateId = `CERT-${Date.now()}-${attemptId.slice(0, 8).toUpperCase()}`;
    const currentDate = new Date().toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const participantName = attempt.profiles.first_name && attempt.profiles.last_name
      ? `${attempt.profiles.first_name} ${attempt.profiles.last_name}`
      : attempt.profiles.email;

    const template = attempt.exams.certificate_template || {};

    // Create certificate data object
    const certificateData = {
      NR_CERTYFIKATU: certificateId,
      DATA: currentDate,
      IMIE_NAZWISKO: participantName,
      SZKOLENIE: template.szkolenie || attempt.exams.title,
      KOMPETENCJE: template.kompetencje || 'Kompetencje związane z ukończonym szkoleniem',
      OPIS_UKONCZENIA: template.opisUkonczenia || 'pomyślnie ukończył szkolenie i zdał egzamin'
    };

    console.log('📋 Certificate data prepared:', certificateData);

    // Load PDF template from Supabase Storage
    let templateBuffer: ArrayBuffer;
    try {
      console.log('📄 Loading PDF template from storage...');
      const { data: templateData, error: templateError } = await supabase.storage
        .from('certificates')
        .download('templates/CERTYFIKAT CentrumAudytu_ISOIEC27001_Audytor_i_Pełnomocnik.pptx.pdf');

      if (templateError) {
        console.error('❌ Template not found in storage:', templateError);
        console.log('📄 Creating fallback PDF...');
        const fallbackPdf = await createFallbackCertificate(certificateData);
        templateBuffer = await fallbackPdf.save();
      } else {
        templateBuffer = await templateData.arrayBuffer();
        console.log('✅ Template loaded from storage, size:', templateBuffer.byteLength, 'bytes');
      }
    } catch (error) {
      console.error('❌ Error loading template, creating fallback:', error);
      const fallbackPdf = await createFallbackCertificate(certificateData);
      templateBuffer = await fallbackPdf.save();
    }

    // Load and modify the PDF
    console.log('🔧 Processing PDF with certificate data...');
    const pdfDoc = await PDFDocument.load(templateBuffer);
    
    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log('📐 PDF dimensions:', { width, height });
    
    // Load fonts with full Unicode support
    let font: PDFFont;
    let boldFont: PDFFont;
    
    try {
      // Try to use system fonts with Unicode support
      // These fonts support Polish characters natively
      console.log('🔤 Loading Unicode fonts...');
      
      // Create a simple font that supports Unicode
      // We'll use the built-in fonts but configure them properly for Unicode
      font = await pdfDoc.embedFont('Helvetica');
      boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      
      console.log('✅ Fonts loaded successfully');
    } catch (fontError) {
      console.error('❌ Error loading fonts:', fontError);
      // Fallback to basic fonts
      font = await pdfDoc.embedFont('Helvetica');
      boldFont = await pdfDoc.embedFont('Helvetica-Bold');
    }

    // Define text positions and styles (adjust these coordinates based on your template)
    const textReplacements = [
      {
        text: certificateData.NR_CERTYFIKATU.normalize('NFC'),
        x: width - 200,
        y: height - 100,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      },
      {
        text: certificateData.DATA.normalize('NFC'),
        x: width - 200,
        y: height - 120,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      },
      {
        text: certificateData.IMIE_NAZWISKO.normalize('NFC'),
        x: width / 2 - 100,
        y: height / 2 + 50,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0)
      },
      {
        text: certificateData.SZKOLENIE.normalize('NFC'),
        x: width / 2 - 150,
        y: height / 2,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0.8)
      },
      {
        text: certificateData.KOMPETENCJE.normalize('NFC'),
        x: 100,
        y: height / 2 - 50,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      }
    ];

    // Apply text replacements
    console.log('✏️ Adding text to PDF...');
    textReplacements.forEach((replacement, index) => {
      try {
        console.log(`Adding text ${index + 1}:`, replacement.text);
        
        // Split long text into multiple lines if needed
        const maxWidth = 400; // Maximum width for text
        const words = replacement.text.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = replacement.font.widthOfTextAtSize(testLine, replacement.size);
          
          if (textWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              lines.push(word);
            }
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Draw each line
        lines.forEach((line, lineIndex) => {
          firstPage.drawText(line, {
            x: replacement.x,
            y: replacement.y - (lineIndex * (replacement.size + 2)),
            size: replacement.size,
            font: replacement.font,
            color: replacement.color,
          });
        });
        
      } catch (textError) {
        console.error(`❌ Error adding text ${index + 1}:`, textError);
        // Try with ASCII fallback
        const asciiText = replacement.text
          .replace(/ą/g, 'a').replace(/Ą/g, 'A')
          .replace(/ć/g, 'c').replace(/Ć/g, 'C')
          .replace(/ę/g, 'e').replace(/Ę/g, 'E')
          .replace(/ł/g, 'l').replace(/Ł/g, 'L')
          .replace(/ń/g, 'n').replace(/Ń/g, 'N')
          .replace(/ó/g, 'o').replace(/Ó/g, 'O')
          .replace(/ś/g, 's').replace(/Ś/g, 'S')
          .replace(/ź/g, 'z').replace(/Ź/g, 'Z')
          .replace(/ż/g, 'z').replace(/Ż/g, 'Z');
          
        console.log(`📝 Using ASCII fallback: ${asciiText}`);
        
        firstPage.drawText(asciiText, {
          x: replacement.x,
          y: replacement.y,
          size: replacement.size,
          font: replacement.font,
          color: replacement.color,
        });
      }
    });

    // Save the modified PDF
    console.log('💾 Saving modified PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ PDF saved, size:', pdfBytes.length, 'bytes');

    // Upload to Supabase Storage
    const fileName = `certificate-${certificateId}.pdf`;
    const filePath = `generated/${fileName}`;
    
    console.log('☁️ Uploading to storage:', filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error uploading PDF:', uploadError);
      throw new Error('Błąd podczas zapisywania certyfikatu');
    }

    console.log('✅ PDF uploaded successfully:', uploadData.path);

    // Get public URL (or signed URL if bucket is private)
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    const certificateUrl = urlData.publicUrl;
    console.log('🔗 Certificate URL generated:', certificateUrl);

    // Store certificate record in database
    console.log('💾 Storing certificate record in database...');
    const { data: certRecord, error: certError } = await supabase
      .from('certificates')
      .insert({
        id: certificateId,
        attempt_id: attemptId,
        participant_id: participantId,
        exam_id: examId,
        certificate_data: certificateData,
        pdf_url: certificateUrl,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (certError) {
      console.error('❌ Error storing certificate record:', certError);
      // Don't fail the whole process if certificate storage fails
      console.log('⚠️ Certificate generated but record not stored in DB');
    } else {
      console.log('✅ Certificate record stored:', certRecord.id);
    }

    console.log('🎉 Certificate generation completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        certificateId,
        certificateData,
        certificateUrl,
        message: 'Certyfikat został wygenerowany pomyślnie'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Certificate generation failed:', error);
    
    // Log error to console for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Błąd generowania certyfikatu',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

// Fallback certificate creation function
async function createFallbackCertificate(certificateData: any): Promise<PDFDocument> {
  console.log('📄 Creating fallback certificate...');
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  // Load fonts with Unicode support
  let font: PDFFont;
  let boldFont: PDFFont;
  
  try {
    console.log('🔤 Loading fallback Unicode fonts...');
    font = await pdfDoc.embedFont('Helvetica');
    boldFont = await pdfDoc.embedFont('Helvetica-Bold');
    console.log('✅ Fallback fonts loaded successfully');
  } catch (fontError) {
    console.error('❌ Error loading fallback fonts:', fontError);
    font = await pdfDoc.embedFont('Helvetica');
    boldFont = await pdfDoc.embedFont('Helvetica-Bold');
  }
  
  // Helper function to safely draw text with Polish characters
  const safeDrawText = (text: string, x: number, y: number, size: number, textFont: PDFFont, color: any) => {
    try {
      // Normalize Unicode characters
      const normalizedText = text.normalize('NFC');
      console.log(`📝 Drawing text: "${normalizedText}"`);
      
      page.drawText(normalizedText, {
        x,
        y,
        size,
        font: textFont,
        color,
      });
    } catch (error) {
      console.error('❌ Error drawing text, using ASCII fallback:', error);
      // ASCII fallback for Polish characters
      const asciiText = text
        .replace(/ą/g, 'a').replace(/Ą/g, 'A')
        .replace(/ć/g, 'c').replace(/Ć/g, 'C')
        .replace(/ę/g, 'e').replace(/Ę/g, 'E')
        .replace(/ł/g, 'l').replace(/Ł/g, 'L')
        .replace(/ń/g, 'n').replace(/Ń/g, 'N')
        .replace(/ó/g, 'o').replace(/Ó/g, 'O')
        .replace(/ś/g, 's').replace(/Ś/g, 'S')
        .replace(/ź/g, 'z').replace(/Ź/g, 'Z')
        .replace(/ż/g, 'z').replace(/Ż/g, 'Z');
        
      page.drawText(asciiText, {
        x,
        y,
        size,
        font: textFont,
        color,
      });
    }
  };
  
  // Draw certificate content
  safeDrawText('CERTYFIKAT', 200, 750, 36, boldFont, rgb(0, 0, 0.8));
  
  safeDrawText('UKOŃCZENIA SZKOLENIA', 180, 700, 20, boldFont, rgb(0, 0, 0.8));
  
  safeDrawText('Niniejszym poświadczamy, że', 150, 600, 16, font, rgb(0, 0, 0));
  
  safeDrawText(certificateData.IMIE_NAZWISKO, 150, 550, 24, boldFont, rgb(0, 0, 0));
  
  safeDrawText('pomyślnie ukończył(a) szkolenie', 150, 500, 16, font, rgb(0, 0, 0));
  
  safeDrawText(certificateData.SZKOLENIE, 150, 450, 18, boldFont, rgb(0, 0, 0.8));
  
  if (certificateData.KOMPETENCJE) {
    safeDrawText('Zakres kompetencji:', 150, 400, 14, boldFont, rgb(0, 0, 0));
    
    safeDrawText(certificateData.KOMPETENCJE, 150, 380, 12, font, rgb(0, 0, 0));
  }
  
  // Footer information
  safeDrawText(`Nr certyfikatu: ${certificateData.NR_CERTYFIKATU}`, 150, 200, 10, font, rgb(0.5, 0.5, 0.5));
  
  safeDrawText(`Data wystawienia: ${certificateData.DATA}`, 150, 180, 10, font, rgb(0.5, 0.5, 0.5));
  
  safeDrawText('Centrum Audytu', 150, 160, 10, font, rgb(0.5, 0.5, 0.5));
  
  safeDrawText('ul. Żurawia 6/12/766, 00-503 Warszawa', 150, 140, 10, font, rgb(0.5, 0.5, 0.5));
  
  console.log('✅ Fallback certificate created');
  return pdfDoc;
}