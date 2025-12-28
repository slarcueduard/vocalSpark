import ReactGA from "react-ga4";

// Measurement ID provided by user
const MEASUREMENT_ID = "G-QX39VK3MLX";

export const initGA = () => {
    try {
        ReactGA.initialize(MEASUREMENT_ID);
        console.log("GA Initialized with ID:", MEASUREMENT_ID);
    } catch (error) {
        console.error("GA Initialization Failed:", error);
    }
};

export const logPageView = () => {
    try {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
    } catch (error) {
        console.error("GA Pageview Log Failed:", error);
    }
};

export const logEvent = (category: string, action: string, label?: string) => {
    try {
        ReactGA.event({
            category,
            action,
            label
        });
    } catch (error) {
        console.error("GA Event Log Failed:", error);
    }
};
