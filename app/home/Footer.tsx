    
export default function Footer() {
    return (
      <footer className="bg-white border-t border-black/5  py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Grid links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">Platform</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Solutions</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Accounting team</a></li>
                <li><a href="#" className="hover:text-gray-900">Audit team</a></li>
                <li><a href="#" className="hover:text-gray-900">Partners</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Resources center</a></li>
                <li><a href="#" className="hover:text-gray-900">Compliance glossary</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Career</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
          </div>
  
          {/* Bottom line */}
          <div className="border-t border-black/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-gray-600 text-sm">
            <span className="font-semibold text-blue-800">Brullion</span>
            <span>All rights reserved © Brullion</span>
          </div>
        </div>
      </footer>
    );
  }
