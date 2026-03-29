using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ElektroKasirDesktop
{
    public partial class Form1 : Form
    {
        private Process _nodeProcess;
        private WebView2 _webView;

        public Form1()
        {
            InitializeComponent();
            this.Text = "ElektroKasir - Desktop App";
            this.Width = 1280;
            this.Height = 800;
            this.StartPosition = FormStartPosition.CenterScreen;
            
            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;
        }

        private async void Form1_Load(object sender, EventArgs e)
        {
            StartBackend();

            _webView = new WebView2
            {
                Dock = DockStyle.Fill
            };
            this.Controls.Add(_webView);

            try
            {
                await _webView.EnsureCoreWebView2Async(null);
                _webView.CoreWebView2.Navigate("http://localhost:5000");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal memuat WebView2. Pastikan Edge WebView2 Runtime telah terinstall.\nError: {ex.Message}", "WebView2 Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void StartBackend()
        {
            try
            {
                string basePath = AppDomain.CurrentDomain.BaseDirectory;
                string currentDir = basePath;
                
                // Cari folder "backend" dengan naik terus ke parent directory
                while (currentDir != null && !Directory.Exists(Path.Combine(currentDir, "backend")))
                {
                    currentDir = Directory.GetParent(currentDir)?.FullName;
                }

                if (currentDir == null)
                {
                    MessageBox.Show("Folder 'backend' tidak ditemukan dari lokasi eksekusi.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string backendPath = Path.Combine(currentDir, "backend");
                string indexPath = Path.Combine(backendPath, "src", "index.js");

                if (!File.Exists(indexPath))
                {
                    MessageBox.Show($"File index.js tidak ditemukan di:\n{indexPath}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"\"{indexPath}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = backendPath
                };

                _nodeProcess = new Process { StartInfo = psi };
                _nodeProcess.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal menjalankan server latar belakang Node.js: {ex.Message}", "Node.js Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (_nodeProcess != null && !_nodeProcess.HasExited)
            {
                try
                {
                    _nodeProcess.Kill(true); // Kill process tree
                }
                catch { }
            }
        }
    }
}
