import React from 'react';
import { X, Download, Award, Calendar, User, Hash, CheckCircle } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    examTitle: string;
    participantName: string;
    completionDate: string;
    score: number;
    certificateId: string;
    kompetencje?: string;
    opisUkonczenia?: string;
    pdfUrl?: string;
  };
}

const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, certificate }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (certificate.pdfUrl) {
      // Download actual PDF
      window.open(certificate.pdfUrl, '_blank');
    } else {
      // Fallback to print
      window.print();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 print:hidden gap-3 sm:gap-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Certyfikat ukończenia</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Oficjalny certyfikat Centrum Audytu</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Pobierz PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="p-4 sm:p-8 print:p-0">
          <div className="max-w-3xl mx-auto">
            {/* Certificate Design */}
            <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 border-4 sm:border-8 border-blue-600 rounded-lg p-6 sm:p-12 print:border-4 print:p-8">
              {/* Decorative corners */}
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-t-2 sm:border-l-4 sm:border-t-4 border-blue-600 print:w-6 print:h-6"></div>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-t-2 sm:border-r-4 sm:border-t-4 border-blue-600 print:w-6 print:h-6"></div>
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-b-2 sm:border-l-4 sm:border-b-4 border-blue-600 print:w-6 print:h-6"></div>
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-b-2 sm:border-r-4 sm:border-b-4 border-blue-600 print:w-6 print:h-6"></div>

              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center print:w-16 print:h-16">
                    <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white print:h-8 print:w-8" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 print:text-3xl">CERTYFIKAT</h1>
                <p className="text-base sm:text-xl text-blue-600 font-semibold print:text-lg">UKOŃCZENIA SZKOLENIA</p>
              </div>

              {/* Main Content */}
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-sm sm:text-lg text-gray-700 mb-4 sm:mb-6 print:text-base">
                  Niniejszym poświadczamy, że
                </p>
                
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6 print:p-4">
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 print:text-2xl break-words">
                    {certificate.participantName}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">pomyślnie ukończył(a) szkolenie</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200 mb-4 sm:mb-6 print:p-4">
                  <h3 className="text-lg sm:text-2xl font-semibold text-blue-900 mb-2 print:text-xl break-words">
                    {certificate.examTitle}
                  </h3>
                  {certificate.kompetencje && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white rounded border border-blue-100">
                      <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Zakres kompetencji:</p>
                      <p className="text-blue-800 text-xs sm:text-sm break-words">{certificate.kompetencje}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-blue-700 print:space-x-4 mt-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Status: {typeof certificate.score === 'number' ? `${certificate.score}%` : certificate.score}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {formatDate(certificate.completionDate)}
                    </div>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 print:text-sm px-2">
                  {certificate.opisUkonczenia || 'osiągając wymagany standard wiedzy i umiejętności'}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center print:gap-4">
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-2" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Nr certyfikatu</p>
                    <p className="font-mono font-semibold text-gray-900 text-xs sm:text-sm break-all">{certificate.certificateId}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-2" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Data wydania</p>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{formatDate(certificate.completionDate)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <Award className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-2" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Wystawca</p>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Centrum Audytu</p>
                  </div>
                </div>
              </div>

              {/* Signature Area */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 print:gap-6">
                  <div className="text-center">
                    <div className="border-b border-gray-400 mb-2 pb-6 sm:pb-8"></div>
                    <p className="text-xs sm:text-sm text-gray-600">Podpis osoby upoważnionej</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-gray-400 mb-2 pb-6 sm:pb-8"></div>
                    <p className="text-xs sm:text-sm text-gray-600">Pieczęć organizacji</p>
                  </div>
                </div>
              </div>

              {/* Organization Info */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs text-gray-500 print:text-xs">
                  Centrum Audytu • ul. Żurawia 6/12/766, 00-503 Warszawa • kontakt@centrumaudytu.pl
                </p>
              </div>
            </div>

            {/* Verification Info */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 print:hidden">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-2" />
                  Certyfikat zweryfikowany
                </div>
                <div className="flex items-center">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2" />
                  <span className="break-all">ID: {certificate.certificateId}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-2 px-2">
                Certyfikat można zweryfikować na stronie centrum-audytu.pl/weryfikacja
              </p>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
            .print\\:p-4 {
              padding: 1rem !important;
            }
            .print\\:p-8 {
              padding: 2rem !important;
            }
            .print\\:border-4 {
              border-width: 4px !important;
            }
            .print\\:w-6 {
              width: 1.5rem !important;
            }
            .print\\:h-6 {
              height: 1.5rem !important;
            }
            .print\\:w-16 {
              width: 4rem !important;
            }
            .print\\:h-16 {
              height: 4rem !important;
            }
            .print\\:h-8 {
              height: 2rem !important;
            }
            .print\\:w-8 {
              width: 2rem !important;
            }
            .print\\:text-3xl {
              font-size: 1.875rem !important;
            }
            .print\\:text-lg {
              font-size: 1.125rem !important;
            }
            .print\\:text-base {
              font-size: 1rem !important;
            }
            .print\\:text-2xl {
              font-size: 1.5rem !important;
            }
            .print\\:text-xl {
              font-size: 1.25rem !important;
            }
            .print\\:text-sm {
              font-size: 0.875rem !important;
            }
            .print\\:text-xs {
              font-size: 0.75rem !important;
            }
            .print\\:space-x-4 > * + * {
              margin-left: 1rem !important;
            }
            .print\\:gap-4 {
              gap: 1rem !important;
            }
            .print\\:gap-6 {
              gap: 1.5rem !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CertificateModal;