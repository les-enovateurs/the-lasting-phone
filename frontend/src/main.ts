
// Define interfaces for type safety
interface CustomerData {
    event_slug: string;
    name: string;
    email: string;
    accept_recontact: boolean;
    accept_newsletter: boolean;
    user_agent: string;
    device_brand?: string;
    device_model?: string;
    fabrication_date: string;
}

interface DeviceRanking {
    rank: number;
    total: number;
}

interface ApiResponse {
    success: boolean;
    customerId?: number;
    deviceRanking?: DeviceRanking;
    error?: string;
}

document.addEventListener('DOMContentLoaded', function() {
    // Get the event slug from the URL (e.g., ?event=my-event)
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug: string | null = urlParams.get('event');

    // Elements
    const registrationForm: HTMLElement = document.getElementById('registrationForm') as HTMLElement;
    const eventNotFound: HTMLElement = document.getElementById('eventNotFound') as HTMLElement;
    const resultCard: HTMLElement = document.getElementById('resultCard') as HTMLElement;
    const submitButton: HTMLButtonElement = document.getElementById('submitButton') as HTMLButtonElement;
    const loading: HTMLElement = document.getElementById('loading') as HTMLElement;

    // Form fields
    const nameInput: HTMLInputElement = document.getElementById('name') as HTMLInputElement;
    const emailInput: HTMLInputElement = document.getElementById('email') as HTMLInputElement;
    const deviceBrandInput: HTMLInputElement = document.getElementById('deviceBrand') as HTMLInputElement;
    const deviceModelInput: HTMLInputElement = document.getElementById('deviceModel') as HTMLInputElement;
    const fabricationDateInput: HTMLInputElement = document.getElementById('fabricationDate') as HTMLInputElement;
    const acceptRecontact: HTMLInputElement = document.getElementById('acceptRecontact') as HTMLInputElement;
    const acceptNewsletter: HTMLInputElement = document.getElementById('acceptNewsletter') as HTMLInputElement;

    // Error elements
    const nameError: HTMLElement = document.getElementById('nameError') as HTMLElement;
    const emailError: HTMLElement = document.getElementById('emailError') as HTMLElement;
    const fabricationDateError: HTMLElement = document.getElementById('fabricationDateError') as HTMLElement;
    const submitError: HTMLElement = document.getElementById('submitError') as HTMLElement;

    // Result elements
    const deviceFullModel: HTMLElement = document.getElementById('deviceFullModel') as HTMLElement;
    const deviceFabricationDate: HTMLElement = document.getElementById('deviceFabricationDate') as HTMLElement;
    const rankingContainer: HTMLElement = document.getElementById('rankingContainer') as HTMLElement;
    const rankingValue: HTMLElement = document.getElementById('rankingValue') as HTMLElement;
    const rankingDescription: HTMLElement = document.getElementById('rankingDescription') as HTMLElement;

    // First, verify the event exists
    if (!eventSlug) {
        showEventNotFoundError();
        return;
    }

    verifyEvent(eventSlug)
        .then(eventExists => {
            if (!eventExists) {
                showEventNotFoundError();
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de l\'événement:', error);
            showEventNotFoundError();
        });

    // Form submission
    submitButton.addEventListener('click', function() {
        if (validateForm()) {
            submitRegistration();
        }
    });

    // Functions
    async function verifyEvent(slug: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/event/${slug}`);
            return response.ok;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'événement:', error);
            return false;
        }
    }

    function showEventNotFoundError(): void {
        registrationForm.classList.add('hidden');
        eventNotFound.classList.remove('hidden');
    }

    function validateForm(): boolean {
        let isValid = true;

        // Reset errors
        nameError.classList.add('hidden');
        emailError.classList.add('hidden');
        fabricationDateError.classList.add('hidden');
        submitError.classList.add('hidden');

        // Validate name
        if (!nameInput.value.trim()) {
            nameError.classList.remove('hidden');
            isValid = false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
            emailError.classList.remove('hidden');
            isValid = false;
        }

        // Validate fabrication date (required)
        if (!fabricationDateInput.value) {
            fabricationDateError.classList.remove('hidden');
            isValid = false;
        }

        return isValid;
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('fr-FR', options);
    }

    function formatDeviceModel(brand: string, model: string): string {
        const cleanBrand = brand.trim();
        const cleanModel = model.trim();

        if (cleanBrand && cleanModel) {
            return `${cleanBrand} ${cleanModel}`;
        } else if (cleanBrand) {
            return cleanBrand;
        } else if (cleanModel) {
            return cleanModel;
        } else {
            return 'Téléphone non spécifié';
        }
    }

    async function submitRegistration(): Promise<void> {
        // Show loading state
        submitButton.disabled = true;
        loading.classList.remove('hidden');
        submitError.classList.add('hidden');

        // Prepare data
        const data: CustomerData = {
            event_slug: eventSlug as string,
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            accept_recontact: acceptRecontact.checked,
            accept_newsletter: acceptNewsletter.checked,
            user_agent: navigator.userAgent,
            device_brand: deviceBrandInput.value.trim() || undefined,
            device_model: deviceModelInput.value.trim() || undefined,
            fabrication_date: fabricationDateInput.value
        };

        try {
            // Send registration
            const response = await fetch('/api/customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Erreur de réseau');
            }

            const responseData: ApiResponse = await response.json();

            // Handle successful registration
            registrationForm.classList.add('hidden');
            resultCard.classList.remove('hidden');

            // Display device info
            const deviceModel = formatDeviceModel(
                deviceBrandInput.value,
                deviceModelInput.value
            );
            deviceFullModel.textContent = deviceModel;
            deviceFabricationDate.textContent = formatDate(fabricationDateInput.value);

            // Display ranking if available
            if (responseData.deviceRanking) {
                rankingContainer.classList.remove('hidden');
                const { rank, total } = responseData.deviceRanking;

                rankingValue.textContent = `${rank} / ${total}`;

                // Calculate and display percentile
                const percentile = Math.round((1 - (rank / total)) * 100);

                if (rank === 1) {
                    rankingDescription.textContent = `🎉 Félicitations ! Vous avez le téléphone le plus ancien de l'événement !`;
                }
                /*else if (percentile < 10) {
                    rankingDescription.textContent = `📱 Votre téléphone fait partie des plus anciens ! (${100-percentile}% plus récents)`;
                } else if (percentile < 25) {
                    rankingDescription.textContent = `🔋 Votre téléphone vieillit bien ! (${percentile}% plus anciens)`;
                } else if (percentile < 50) {
                    rankingDescription.textContent = `📱 Votre téléphone est plus ancien que la moyenne.`;
                } */
                else if (percentile < 75) {
                    rankingDescription.textContent = `✨ ${percentile}% des participants possèdent un téléphone plus récent que le vôtre.`;
                } else {
                    rankingDescription.textContent = `🆕 Votre téléphone est très récent ! (${percentile}% plus anciens)`;
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            submitError.classList.remove('hidden');
            submitButton.disabled = false;
        } finally {
            loading.classList.add('hidden');
        }
    }
});