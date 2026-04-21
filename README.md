# 🛡️ Intrusion Detection & Prevention System (IDPS)

A professional-grade, real-time security monitoring dashboard. This application is designed to visualize network traffic, detect potential intrusions, and manage prevention protocols through a high-performance web interface.

**🌐 [View Live Demo]( https://intrusion-detection-prevention-fblxmb4xu.vercel.app)** ---

## 🛠️ Technical Architecture

This project leverages a modern, scalable tech stack designed for speed and type safety:

* **Frontend Framework:** React (via Vite) for a highly responsive UI.
* **Language:** TypeScript to ensure robust, error-free security logic.
* **Backend-as-a-Service:** Supabase (PostgreSQL) for real-time data streaming and secure logging.
* **Styling:** Tailwind CSS for a clean, professional "Security Operations Center" (SOC) aesthetic.
* **Deployment:** Vercel (CI/CD integrated with GitHub).

## ✨ Key Features

* **Real-Time Threat Streaming:** Utilizes Supabase Realtime to push security alerts to the dashboard without refreshing.
* **Traffic Analysis:** Visual representation of incoming requests and potential vulnerability points.
* **Automated Response:** Integrated prevention logic to simulate the blocking of malicious actors.
* **Secure Admin Access:** Full authentication flow to protect sensitive security logs.
* **Responsive Design:** Fully optimized for desktop monitoring and mobile alerts.

## 🚀 Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/parvpandat-debug/Intrusion-Detection-and-prevention-system.git](https://github.com/parvpandat-debug/Intrusion-Detection-and-prevention-system.git)
    cd Intrusion-Detection-and-prevention-system
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Launch:**
    ```bash
    npm run dev
    ```

## 📈 Interview Discussion Points

* **Why Vite?** I chose Vite over Create React App for its ES-module-based hot reloading, which significantly sped up the development of the real-time dashboard.
* **Type Safety:** Using TypeScript allowed me to define strict interfaces for "Threat" and "Log" objects, preventing data mismatch errors during live streams.
* **Scalability:** By using Supabase, the system can handle thousands of concurrent security logs thanks to the underlying PostgreSQL architecture.

---

**Developed by Parv Sharma** *Computer Science & Engineering Student - Cyber Security | Greater Noida Institute of Technology*
