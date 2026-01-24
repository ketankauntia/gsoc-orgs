
interface ExternalProject {
  project_id: string;
  project_title: string;
  contributor: string;
  mentors: string[]; // API return array of strings
  org_slug: string;
  year: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    projects: ExternalProject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export async function fetchExternalProjects(year: number): Promise<ExternalProject[]> {
  const allProjects: ExternalProject[] = [];
  let currentPage = 1;
  let totalPages = 1;

  console.log(`[External API] Fetching projects for year ${year}...`);

  try {
    // Initial fetch to get pagination
    const initialRes = await fetch(`https://www.gsocorganizationsguide.com/api/v1/projects?year=${year}&page=1`);
    if (!initialRes.ok) {
        console.error(`[External API] Failed to fetch page 1 for year ${year}: ${initialRes.statusText}`);
        return [];
    }
    const initialData = await initialRes.json() as ApiResponse;

    if (!initialData.success) {
      console.error(`[External API] Failed to fetch page 1 for year ${year}`);
      return [];
    }
    
    allProjects.push(...initialData.data.projects);
    totalPages = initialData.data.pagination.pages;
    console.log(`[External API] Found ${initialData.data.pagination.total} projects across ${totalPages} pages.`);

    // Fetch remaining pages
    const pagePromises: Promise<void>[] = [];
    
    for (let i = 2; i <= totalPages; i++) {
        const p = fetch(`https://www.gsocorganizationsguide.com/api/v1/projects?year=${year}&page=${i}`)
          .then(async res => {
            if (res.ok) {
                const data = await res.json() as ApiResponse;
                if (data.success) {
                    allProjects.push(...data.data.projects);
                    process.stdout.write('.'); // progress indicator
                }
            }
          })
          .catch(e => {
            console.error(`[External API] Error fetching page ${i}: ${e.message}`);
          });
        pagePromises.push(p);

        // Throttle slightly - chunks of 10
        if (pagePromises.length >= 10) {
           await Promise.all(pagePromises);
           pagePromises.length = 0;
        }
    }
    
    // Await remaining
    if (pagePromises.length > 0) {
      await Promise.all(pagePromises);
    }
    
    console.log(`\n[External API] Fetched ${allProjects.length} projects.`);
    return allProjects;

  } catch (error) {
    console.error(`[External API] Error fetching data:`, error);
    return [];
  }
}
