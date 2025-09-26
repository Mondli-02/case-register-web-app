// ===== CONFIGURATION - REPLACE THESE VALUES =====
      const SUPABASE_URL = "https://sqyigvmwfretpqdbqkjy.supabase.co";
      const SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWlndm13ZnJldHBxZGJxa2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjgwMjMsImV4cCI6MjA3NDQwNDAyM30.oF09tEpOu175se8X4hXpBKi-sgj4p2omAU1CHej50K4";

      // Initialize Supabase
      let supabaseClient;

      let currentUser = null;
      let currentUserProfile = null;
      let currentCaseId = null;

      // ===== LOADER FUNCTIONS =====
      function showLoader() {
        document.getElementById("globalLoader").classList.remove("hidden");
      }
      function hideLoader() {
        document.getElementById("globalLoader").classList.add("hidden");
      }

      // Initialize app
      document.addEventListener("DOMContentLoaded", function () {
        if (typeof window.supabase !== "undefined") {
          supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
          );
          checkAuth();
        } else {
          console.error("Supabase library not loaded");
        }
      });

      // ===== AUTHENTICATION =====
      async function checkAuth() {
        showLoader();
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        if (session) {
          currentUser = session.user;
          await loadUserProfile();
          showMainApp();
        } else {
          showLoginScreen();
        }
        hideLoader();
      }

      async function loadUserProfile() {
        const { data: profiles, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id);

        if (profiles && profiles.length > 0) {
          currentUserProfile = profiles[0];
          updateUserDisplay();
          setupNavigation();
        }
      }

      function updateUserDisplay() {
        const initials = currentUserProfile.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();

        document.getElementById("sidebarAvatar").textContent = initials;
        document.getElementById("sidebarUserName").textContent =
          currentUserProfile.full_name;
        document.getElementById("sidebarUserRole").textContent =
          currentUserProfile.role.toUpperCase();
      }

      function setupNavigation() {
        const navMenu = document.getElementById("navMenu");
        const isAdmin = currentUserProfile.role === "admin";

        const navItems = [
          { id: "dashboard", label: "Dashboard", icon: "🗂️" },
          { id: "search", label: "Search", icon: "🔎" },
          { id: "addCase", label: "Add Case", icon: "✏️" },
          { id: "updateProfile", label: "Update Profile", icon: "🔄" },
          { id: "cases", label: "Cases", icon: "📁" },
        ];

        navMenu.innerHTML = navItems
          .map(
            (item) => `
                <li class="nav-item">
                    <a class="nav-link" onclick="showTab('${item.id}')" data-tab="${item.id}">
                        <span class="nav-icon">${item.icon}</span>
                        ${item.label}
                    </a>
                </li>
            `
          )
          .join("");

        // Show dashboard by default
        showTab("dashboard");
      }

      // Sign In
      document
        .getElementById("signinForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();
          showLoader();
          const email = document.getElementById("signinEmail").value;
          const password = document.getElementById("signinPassword").value;

          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (error) {
            showAuthError(error.message);
            hideLoader();
          } else {
            currentUser = data.user;
            await loadUserProfile();
            showMainApp();
            hideLoader();
          }
        });

      async function signOut() {
        showLoader();
        await supabaseClient.auth.signOut();
        currentUser = null;
        currentUserProfile = null;
        showLoginScreen();
        hideLoader();
      }

      function showAuthError(message) {
        const errorEl = document.getElementById("authError");
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        setTimeout(() => errorEl.classList.add("hidden"), 5000);
      }

      function showLoginScreen() {
        document.getElementById("loginScreen").classList.remove("hidden");
        document.getElementById("mainApp").classList.add("hidden");
      }

      function showMainApp() {
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
      }

      // ===== NAVIGATION =====
      // Mobile menu functionality
document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('mobile-open');
});

// Close mobile menu when clicking on a nav link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('mobile-open');
        }
    });
});
      function showTab(tabName) {
        // Update active nav link
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("active");
          if (link.dataset.tab === tabName) {
            link.classList.add("active");
          }
        });

        // Hide all tab contents
        document.querySelectorAll(".tab-content").forEach((tab) => {
          tab.classList.add("hidden");
        });

        // Show selected tab
        const targetTab = document.getElementById(tabName + "Tab");
        if (targetTab) {
          targetTab.classList.remove("hidden");
        }

        // Load tab-specific content
        switch (tabName) {
          case "dashboard":
            loadDashboard();
            break;
          case "cases":
            loadAllCases();
            populateYearFilter();
            break;
          case "addCase":
            loadOfficers();
            break;
          case "updateProfile":
            loadProfileForUpdate();
            break;
        }
      }

      // ===== DASHBOARD =====
      async function loadDashboard() {
        const dashboardContent = document.getElementById("dashboardContent");
        const isAdmin = currentUserProfile.role === "admin";

        if (isAdmin) {
          await loadAdminDashboard();
        } else {
          await loadOfficerDashboard();
        }
      }

      async function loadOfficerDashboard() {
        const dashboardContent = document.getElementById("dashboardContent");

        // Get stats for current officer
        const { data: cases, error } = await supabaseClient
          .from("cases")
          .select("*")
          .eq("officer_handling_case", currentUser.id);

        const totalCases = cases ? cases.length : 0;
        const activeCases = cases
          ? cases.filter((c) => c.status !== "concluded").length
          : 0;
        const concludedCases = cases
          ? cases.filter((c) => c.status === "concluded").length
          : 0;

        dashboardContent.innerHTML = `
                <!-- Profile Card -->
                <div class="info-card">
                    <div class="card-header">
                        <h3 class="card-title">Profile</h3>
                        <span class="card-icon">👤</span>
                    </div>
                    <div class="profile-section">
                        <div class="profile-avatar">
                            ${currentUserProfile.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                        </div>
                        <div class="profile-details">
                            <h3>${currentUserProfile.full_name}</h3>
                            <span class="role-badge role-${
                              currentUserProfile.role
                            }">${currentUserProfile.role}</span>
                        </div>
                    </div>
                    <div class="profile-info">
                        <div class="info-item">
                            <span class="info-label">Region:</span>
                            <span>${
                              currentUserProfile.region || "Not set"
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone:</span>
                            <span>${
                              currentUserProfile.phone_number || "Not set"
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span>${currentUserProfile.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">WhatsApp:</span>
                            <span>${
                              currentUserProfile.whatsapp_contact || "Not set"
                            }</span>
                        </div>
                    </div>
                    <button onclick="showTab('updateProfile')" class="btn btn-primary btn-sm">Update Profile</button>
                </div>

                <!-- Stats Card -->
                <div class="info-card">
                    <div class="card-header">
                        <h3 class="card-title">Case Statistics</h3>
                        <span class="card-icon">📊</span>
                    </div>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-number">${totalCases}</div>
                            <div class="stat-label">Total Cases</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${activeCases}</div>
                            <div class="stat-label">Active Cases</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${concludedCases}</div>
                            <div class="stat-label">Concluded Cases</div>
                        </div>
                    </div>
                </div>
            `;

        // Show recent active cases table
        await loadRecentActiveCases();
        document.getElementById("recentCasesTable").classList.remove("hidden");
        document.getElementById("officerProfilesTable").classList.add("hidden");
      }

      async function loadAdminDashboard() {
        const dashboardContent = document.getElementById("dashboardContent");

        // Get overall stats
        const { data: allCases, error: casesError } = await supabaseClient
          .from("cases")
          .select("*");

        const { data: officers, error: officersError } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("role", "officer");

        // Debug logging
        console.log("Officers query result:", officers);
        console.log("Officers query error:", officersError);

        const totalOfficers = officers ? officers.length : 0;
        const totalCases = allCases ? allCases.length : 0;
        const activeCases = allCases
          ? allCases.filter((c) => c.status !== "concluded").length
          : 0;
        const concludedCases = allCases
          ? allCases.filter((c) => c.status === "concluded").length
          : 0;

        dashboardContent.innerHTML = `
                <!-- Stats Card -->
                <div class="info-card">
                    <div class="card-header">
                        <h3 class="card-title">System Statistics</h3>
                        <span class="card-icon">📊</span>
                    </div>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-number">${totalOfficers}</div>
                            <div class="stat-label">Total Officers</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${activeCases}</div>
                            <div class="stat-label">Active Cases</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${concludedCases}</div>
                            <div class="stat-label">Concluded Cases</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${totalCases}</div>
                            <div class="stat-label">Total Cases</div>
                        </div>
                    </div>
                </div>
            `;

        // Show officer profiles table
        await loadOfficerProfiles();
        document
          .getElementById("officerProfilesTable")
          .classList.remove("hidden");
        document.getElementById("recentCasesTable").classList.add("hidden");
      }

      async function loadRecentActiveCases() {
        const { data: cases, error } = await supabaseClient
          .from("cases")
          .select("*")
          .eq("officer_handling_case", currentUser.id)
          .neq("status", "concluded")
          .order("created_at", { ascending: false })
          .limit(10);

        const tbody = document.getElementById("recentCasesBody");
        tbody.innerHTML = "";

        if (cases && cases.length > 0) {
          cases.forEach((caseItem) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${caseItem.case_number}</td>
                        <td>${new Date(
                          caseItem.date_reported
                        ).toLocaleDateString()}</td>
                        <td>${
                          caseItem.complainant_address || "Not specified"
                        }</td>
                        <td>${
                          caseItem.respondent_address || "Not specified"
                        }</td>
                        <td><span class="status-badge status-${
                          caseItem.status
                        }">${caseItem.status
              .replace("_", " ")
              .toUpperCase()}</span></td>
                        <td>
                            <button onclick="viewCase(${
                              caseItem.id
                            })" class="btn btn-primary btn-sm">Update</button>
                        </td>
                    `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 40px;">No active cases found</td></tr>';
        }
      }

      async function loadOfficerProfiles() {
        const { data: officers, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("role", "officer");

        const tbody = document.getElementById("officerProfilesBody");
        tbody.innerHTML = "";

        if (officers && officers.length > 0) {
          for (const officer of officers) {
            // Get case statistics for each officer
            const { data: officerCases } = await supabaseClient
              .from("cases")
              .select("status")
              .eq("officer_handling_case", officer.id);

            const totalCases = officerCases ? officerCases.length : 0;
            const activeCases = officerCases
              ? officerCases.filter((c) => c.status !== "concluded").length
              : 0;
            const concludedCases = officerCases
              ? officerCases.filter((c) => c.status === "concluded").length
              : 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 32px; height: 32px; font-size: 12px; margin-right: 12px;">
                                    ${officer.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                </div>
                                <div>
                                    <div style="font-weight: 500;">${
                                      officer.full_name
                                    }</div>
                                    <div style="font-size: 12px; color: #6b7280;">${
                                      officer.email
                                    }</div>
                                </div>
                            </div>
                        </td>
                        <td><span class="role-badge role-${officer.role}">${
              officer.role
            }</span></td>
                        <td>${officer.region || "Not set"}</td>
                        <td><span class="stat-number" style="font-size: 16px;">${activeCases}</span></td>
                        <td><span class="stat-number" style="font-size: 16px;">${concludedCases}</span></td>
                        <td><span class="stat-number" style="font-size: 16px;">${totalCases}</span></td>
                        <td>
                            <button onclick="viewOfficerProfile('${
                              officer.id
                            }')" class="btn btn-primary btn-sm">View Officer Cases</button>
                        </td>
                    `;
            tbody.appendChild(row);
          }
        } else {
          tbody.innerHTML =
            '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 40px;">No officers found</td></tr>';
        }
      }

      // ===== CASES MANAGEMENT =====
      async function loadAllCases() {
        document.getElementById("casesLoading").classList.remove("hidden");
        document.getElementById("casesContainer").classList.add("hidden");

        let query = supabaseClient
          .from("cases")
          .select(
            `
                    *,
                    officer_profile:profiles!cases_officer_handling_case_fkey(full_name)
                `
          )
          .order("created_at", { ascending: false });

        // If not admin, filter by assigned officer
        if (currentUserProfile.role !== "admin") {
          query = query.eq("officer_handling_case", currentUser.id);
        }

        const { data: cases, error } = await query;

        if (error) {
          console.error("Error loading cases:", error);
          return;
        }

        displayAllCases(cases);
      }

      function displayAllCases(cases) {
        const tbody = document.getElementById("casesTableBody");
        tbody.innerHTML = "";

        if (cases && cases.length > 0) {
          cases.forEach((caseItem) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${caseItem.case_number}</td>
                        <td>${new Date(
                          caseItem.date_reported
                        ).toLocaleDateString()}</td>
                        <td>${
                          caseItem.complainant_address || "Not specified"
                        }</td>
                        <td>${
                          caseItem.respondent_address || "Not specified"
                        }</td>
                        <td><span class="status-badge status-${
                          caseItem.status
                        }">${caseItem.status
              .replace("_", " ")
              .toUpperCase()}</span></td>
                        <td>
                            <button onclick="viewCase(${
                              caseItem.id
                            })" class="btn btn-primary btn-sm">View</button>
                        </td>
                    `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 40px;">No cases found</td></tr>';
        }

        document.getElementById("casesLoading").classList.add("hidden");
        document.getElementById("casesContainer").classList.remove("hidden");
      }

      async function loadOfficers() {
        const { data: officers, error } = await supabaseClient
          .from("profiles")
          .select("id, full_name")
          .eq("role", "officer")
          .order("full_name");

        if (error) {
          console.error("Error loading officers:", error);
          return;
        }

        const select = document.getElementById("officerHandling");
        select.innerHTML = '<option value="">Select Officer</option>';

        officers.forEach((officer) => {
          const option = document.createElement("option");
          option.value = officer.id;
          option.textContent = officer.full_name;
          if (
            currentUserProfile.role === "officer" &&
            officer.id === currentUser.id
          ) {
            option.selected = true;
          }
          select.appendChild(option);
        });
      }

      // Add Case
      document
        .getElementById("addCaseForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();

          const caseData = {
            case_number: document.getElementById("caseNumber").value,
            date_reported: document.getElementById("dateReported").value,
            complainant_address:
              document.getElementById("complainantAddress").value,
            respondent_address:
              document.getElementById("respondentAddress").value,
            nature_and_details:
              document.getElementById("natureAndDetails").value,
            membership_status:
              document.getElementById("membershipStatus").value,
            officer_handling_case:
              document.getElementById("officerHandling").value || null,
            action_taken: document.getElementById("actionTaken").value,
            date_concluded:
              document.getElementById("dateConcluded").value || null,
            status: document.getElementById("caseStatus").value,
            comments: document.getElementById("comments").value,
            created_by: currentUser.id,
          };

          const { data, error } = await supabaseClient
            .from("cases")
            .insert(caseData);

          if (error) {
            showAddCaseError(error.message);
          } else {
            showAddCaseSuccess("Case added successfully!");
            document.getElementById("addCaseForm").reset();
            if (currentUserProfile.role === "officer") {
              document.getElementById("officerHandling").value = currentUser.id;
            }
          }
        });

      // ===== CASE MODAL =====
      async function viewCase(caseId) {
        currentCaseId = caseId;

        const { data: caseData, error } = await supabaseClient
          .from("cases")
          .select(
            `
                    *,
                    officer_profile:profiles!cases_officer_handling_case_fkey(full_name, id)
                `
          )
          .eq("id", caseId)
          .single();

        if (error || !caseData) {
          alert("Error loading case details");
          return;
        }

        // Load officers for dropdown
        const { data: officers } = await supabaseClient
          .from("profiles")
          .select("id, full_name")
          .eq("role", "officer")
          .order("full_name");

        const officerOptions = officers
          ? officers
              .map(
                (officer) =>
                  `<option value="${officer.id}" ${
                    officer.id === caseData.officer_handling_case
                      ? "selected"
                      : ""
                  }>${officer.full_name}</option>`
              )
              .join("")
          : "";

        document.getElementById("caseDetailsContent").innerHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Case Number</label>
                        <input type="text" id="editCaseNumber" class="form-input" value="${
                          caseData.case_number
                        }" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date Reported</label>
                        <input type="date" id="editDateReported" class="form-input" value="${
                          caseData.date_reported
                        }" required>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Complainant Address</label>
                        <input type="text" id="editComplainantAddress" class="form-input" value="${
                          caseData.complainant_address || ""
                        }">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Respondent Address</label>
                        <input type="text" id="editRespondentAddress" class="form-input" value="${
                          caseData.respondent_address || ""
                        }">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Nature & Details of Complaint</label>
                    <textarea id="editNatureAndDetails" class="form-textarea" required>${
                      caseData.nature_and_details || ""
                    }</textarea>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Membership Status</label>
                        <select id="editMembershipStatus" class="form-select">
                            <option value="unknown" ${
                              caseData.membership_status === "unknown"
                                ? "selected"
                                : ""
                            }>Unknown</option>
                            <option value="member" ${
                              caseData.membership_status === "member"
                                ? "selected"
                                : ""
                            }>Member</option>
                            <option value="non_member" ${
                              caseData.membership_status === "non_member"
                                ? "selected"
                                : ""
                            }>Non-Member</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Officer Handling Case</label>
                        <select id="editOfficerHandling" class="form-select">
                            <option value="">Select Officer</option>
                            ${officerOptions}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Action Taken To Redress Matter</label>
                    <textarea id="editActionTaken" class="form-textarea">${
                      caseData.action_taken || ""
                    }</textarea>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Date When Case Concluded</label>
                        <input type="date" id="editDateConcluded" class="form-input" value="${
                          caseData.date_concluded || ""
                        }">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="editCaseStatus" class="form-select">
                            <option value="open" ${
                              caseData.status === "open" ? "selected" : ""
                            }>Open</option>
                            <option value="in_progress" ${
                              caseData.status === "in_progress"
                                ? "selected"
                                : ""
                            }>In Progress</option>
                            <option value="concluded" ${
                              caseData.status === "concluded" ? "selected" : ""
                            }>Concluded</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Comments</label>
                    <textarea id="editComments" class="form-textarea">${
                      caseData.comments || ""
                    }</textarea>
                </div>
            `;

        document.getElementById("caseModal").style.display = "block";
      }

      function closeCaseModal() {
        document.getElementById("caseModal").style.display = "none";
        currentCaseId = null;
      }

      // Update Case
      document
        .getElementById("editCaseForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();

          if (!currentCaseId) return;

          const updateData = {
            case_number: document.getElementById("editCaseNumber").value,
            date_reported: document.getElementById("editDateReported").value,
            complainant_address: document.getElementById(
              "editComplainantAddress"
            ).value,
            respondent_address: document.getElementById("editRespondentAddress")
              .value,
            nature_and_details: document.getElementById("editNatureAndDetails")
              .value,
            membership_status: document.getElementById("editMembershipStatus")
              .value,
            officer_handling_case:
              document.getElementById("editOfficerHandling").value || null,
            date_concluded:
              document.getElementById("editDateConcluded").value || null,
            status: document.getElementById("editCaseStatus").value,
            comments: document.getElementById("editComments").value,
          };

          const { error } = await supabaseClient
            .from("cases")
            .update(updateData)
            .eq("id", currentCaseId);

          if (error) {
            showModalError(error.message);
          } else {
            showModalSuccess("Case updated successfully!");
            setTimeout(() => {
              closeCaseModal();
              loadAllCases(); // Refresh the cases list
              loadDashboard(); // Refresh dashboard stats
            }, 2000);
          }
        });

      async function deleteCaseConfirm() {
        if (!currentCaseId) return;

        if (
          confirm(
            "Are you sure you want to delete this case? This action cannot be undone."
          )
        ) {
          const { error } = await supabaseClient
            .from("cases")
            .delete()
            .eq("id", currentCaseId);

          if (error) {
            showModalError(error.message);
          } else {
            showModalSuccess("Case deleted successfully!");
            setTimeout(() => {
              closeCaseModal();
              loadAllCases();
              loadDashboard();
            }, 2000);
          }
        }
      }

      // ===== SEARCH FUNCTIONALITY =====
      async function performSearch() {
        const filters = {
          dateFrom: document.getElementById("searchDateFrom").value,
          dateTo: document.getElementById("searchDateTo").value,
          nature: document.getElementById("searchNature").value,
          complainant: document.getElementById("searchComplainant").value,
          respondent: document.getElementById("searchRespondent").value,
          status: document.getElementById("searchStatus").value,
        };

        let query = supabaseClient
          .from("cases")
          .select(
            `
                    *,
                    officer_profile:profiles!cases_officer_handling_case_fkey(full_name)
                `
          )
          .order("created_at", { ascending: false });

        // Apply role-based filtering
        if (currentUserProfile.role !== "admin") {
          query = query.eq("officer_handling_case", currentUser.id);
        }

        // Apply date filters
        if (filters.dateFrom) {
          query = query.gte("date_reported", filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte("date_reported", filters.dateTo);
        }

        // Apply text filters
        if (filters.nature) {
          query = query.ilike("nature_and_details", `%${filters.nature}%`);
        }
        if (filters.complainant) {
          query = query.ilike(
            "complainant_address",
            `%${filters.complainant}%`
          );
        }
        if (filters.respondent) {
          query = query.ilike("respondent_address", `%${filters.respondent}%`);
        }
        if (filters.status) {
          query = query.eq("status", filters.status);
        }

        const { data: cases, error } = await query;

        if (error) {
          console.error("Search error:", error);
          return;
        }

        displaySearchResults(cases);
      }

      function displaySearchResults(cases) {
        const tbody = document.getElementById("searchResultsBody");
        tbody.innerHTML = "";

        if (cases && cases.length > 0) {
          cases.forEach((caseItem) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${caseItem.case_number}</td>
                        <td>${new Date(
                          caseItem.date_reported
                        ).toLocaleDateString()}</td>
                        <td>${caseItem.nature_and_details.substring(0, 50)}${
              caseItem.nature_and_details.length > 50 ? "..." : ""
            }</td>
                        <td><span class="status-badge status-${
                          caseItem.status
                        }">${caseItem.status
              .replace("_", " ")
              .toUpperCase()}</span></td>
                        <td>${
                          caseItem.officer_profile?.full_name || "Unassigned"
                        }</td>
                        <td>
                            <button onclick="viewCase(${
                              caseItem.id
                            })" class="btn btn-primary btn-sm">View</button>
                            <button onclick="editCase(${
                              caseItem.id
                            })" class="btn btn-secondary btn-sm">Edit</button>
                            <button onclick="deleteCase(${
                              caseItem.id
                            })" class="btn btn-danger btn-sm">Delete</button>
                        </td>
                    `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 40px;">No cases found matching your criteria</td></tr>';
        }

        document.getElementById("searchResults").classList.remove("hidden");
      }

      function clearSearch() {
        document.getElementById("searchDateFrom").value = "";
        document.getElementById("searchDateTo").value = "";
        document.getElementById("searchNature").value = "";
        document.getElementById("searchComplainant").value = "";
        document.getElementById("searchRespondent").value = "";
        document.getElementById("searchStatus").value = "";
        document.getElementById("searchResults").classList.add("hidden");
      }

      // ===== CASES FILTERING =====
      async function populateYearFilter() {
        const { data: cases } = await supabaseClient
          .from("cases")
          .select("date_reported");

        const years = [
          ...new Set(
            cases?.map((c) => new Date(c.date_reported).getFullYear())
          ),
        ].sort((a, b) => b - a);

        const yearSelect = document.getElementById("filterYear");
        yearSelect.innerHTML = '<option value="">All Years</option>';

        years.forEach((year) => {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year;
          yearSelect.appendChild(option);
        });
      }

      async function filterCases() {
        const filters = {
          year: document.getElementById("filterYear").value,
          respondent: document.getElementById("filterRespondent").value,
          nature: document.getElementById("filterNature").value,
          status: document.getElementById("filterStatus").value,
        };

        let query = supabaseClient
          .from("cases")
          .select(
            `
                    *,
                    officer_profile:profiles!cases_officer_handling_case_fkey(full_name)
                `
          )
          .order("created_at", { ascending: false });

        // Apply role-based filtering
        if (currentUserProfile.role !== "admin") {
          query = query.eq("officer_handling_case", currentUser.id);
        }

        // Apply filters
        if (filters.year) {
          const startDate = `${filters.year}-01-01`;
          const endDate = `${filters.year}-12-31`;
          query = query
            .gte("date_reported", startDate)
            .lte("date_reported", endDate);
        }
        if (filters.respondent) {
          query = query.ilike("respondent_address", `%${filters.respondent}%`);
        }
        if (filters.nature) {
          query = query.ilike("nature_and_details", `%${filters.nature}%`);
        }
        if (filters.status) {
          query = query.eq("status", filters.status);
        }

        const { data: cases, error } = await query;

        if (error) {
          console.error("Filter error:", error);
          return;
        }

        displayAllCases(cases);
      }

      function clearCaseFilters() {
        document.getElementById("filterYear").value = "";
        document.getElementById("filterRespondent").value = "";
        document.getElementById("filterNature").value = "";
        document.getElementById("filterStatus").value = "";
        loadAllCases();
      }

      // ===== PROFILE UPDATE =====
      async function loadProfileForUpdate() {
        document.getElementById("updateFullName").value =
          currentUserProfile.full_name || "";
        document.getElementById("updateEmail").value =
          currentUserProfile.email || "";
        document.getElementById("updateRegion").value =
          currentUserProfile.region || "";
        document.getElementById("updatePhone").value =
          currentUserProfile.phone_number || "";
        document.getElementById("updateWhatsApp").value =
          currentUserProfile.whatsapp_contact || "";
      }

      document
        .getElementById("updateProfileForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();

          const updateData = {
            full_name: document.getElementById("updateFullName").value,
            region: document.getElementById("updateRegion").value,
            phone_number: document.getElementById("updatePhone").value,
            whatsapp_contact: document.getElementById("updateWhatsApp").value,
          };

          const { error } = await supabaseClient
            .from("profiles")
            .update(updateData)
            .eq("id", currentUser.id);

          if (error) {
            showUpdateProfileError(error.message);
          } else {
            currentUserProfile = { ...currentUserProfile, ...updateData };
            updateUserDisplay();
            showUpdateProfileSuccess("Profile updated successfully!");
          }
        });

      // ===== OFFICER PROFILE VIEW (Admin only) =====
      async function viewOfficerProfile(officerId) {
        // This will redirect to the search tab with pre-filtered results for this officer
        showTab("search");

        // Clear existing filters
        clearSearch();

        // Load cases for this specific officer
        const { data: cases, error } = await supabaseClient
          .from("cases")
          .select(
            `
                    *,
                    officer_profile:profiles!cases_officer_handling_case_fkey(full_name)
                `
          )
          .eq("officer_handling_case", officerId)
          .order("created_at", { ascending: false });

        if (!error && cases) {
          displaySearchResults(cases);
        }
      }

      // ===== UTILITY FUNCTIONS =====
      function editCase(caseId) {
        viewCase(caseId); // Reuse the existing modal
      }

      async function deleteCase(caseId) {
        if (
          confirm(
            "Are you sure you want to delete this case? This action cannot be undone."
          )
        ) {
          const { error } = await supabaseClient
            .from("cases")
            .delete()
            .eq("id", caseId);

          if (error) {
            alert("Error deleting case: " + error.message);
          } else {
            alert("Case deleted successfully!");
            performSearch(); // Refresh search results
            loadDashboard(); // Refresh dashboard
          }
        }
      }

      function showAddCaseError(message) {
        const errorEl = document.getElementById("addCaseError");
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        setTimeout(() => errorEl.classList.add("hidden"), 5000);
      }

      function showAddCaseSuccess(message) {
        const successEl = document.getElementById("addCaseSuccess");
        successEl.textContent = message;
        successEl.classList.remove("hidden");
        setTimeout(() => successEl.classList.add("hidden"), 5000);
      }

      function showUpdateProfileError(message) {
        const errorEl = document.getElementById("updateProfileError");
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        setTimeout(() => errorEl.classList.add("hidden"), 5000);
      }

      function showUpdateProfileSuccess(message) {
        const successEl = document.getElementById("updateProfileSuccess");
        successEl.textContent = message;
        successEl.classList.remove("hidden");
        setTimeout(() => successEl.classList.add("hidden"), 5000);
      }

      function showModalError(message) {
        const errorEl = document.getElementById("modalError");
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        setTimeout(() => errorEl.classList.add("hidden"), 5000);
      }

      function showModalSuccess(message) {
        const successEl = document.getElementById("modalSuccess");
        successEl.textContent = message;
        successEl.classList.remove("hidden");
        setTimeout(() => successEl.classList.add("hidden"), 5000);
      }

      // Close modal when clicking outside
      window.onclick = function (event) {
        const modal = document.getElementById("caseModal");
        if (event.target === modal) {
          closeCaseModal();
        }
      };