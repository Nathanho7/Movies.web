$(document).ready(function () {
    let moviesData = [];
    let isImportBangerActive = false;
    let isImportNavetActive = false;

    // Vider le conteneur des films au démarrage
    $('#movies-container').empty();

    // Fonction pour charger les films avec filtres
    function loadMovies() {
        const goodNote = parseFloat($('#goodNote').val());
        const badNote = parseFloat($('#badNote').val());
        const origineFilm = $('#FiltrePays').val();
        const niveau = $('#FiltreNiveau').val();
        const noteMin = $('#noteMin').val();
        const noteMax = $('#noteMax').val();

        if (isNaN(goodNote) || isNaN(badNote)) {
            alert("Veuillez entrer des valeurs numériques pour les notes.");
            return;
        }

        let url = 'http://localhost:3000/films?';
        if (isImportBangerActive) {
            url += `noteMin=4.2&`; // Récupérer uniquement les films avec une note >= 4.2
        } else {
            if (origineFilm) url += `origine=${origineFilm}&`;
            if (niveau) url += `niveau=${niveau}&`;
            if (noteMin) url += `noteMin=${noteMin}&`;
            if (noteMax) url += `noteMax=${noteMax}&`;
        }

        url = url.slice(0, -1);

        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                moviesData = response;
                displayMovies(moviesData);
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors du chargement des films :", error);
                alert("Erreur lors du chargement des films.");
            }
        });
    }

    // Fonction pour afficher les films
    function displayMovies(movies) {
        const origineFilm = $('#FiltrePays').val();

        $('#movies-container').empty(); // On vide le conteneur avant d'ajouter les nouveaux films

        const filteredMovies = movies.filter(movie => {
            if (!origineFilm || origineFilm === "TOUS") return true; // Afficher tous les films si "Origine du film" ou "TOUS" est sélectionné
            return movie.origine && movie.origine.trim() === origineFilm.trim(); // Filtrer par origine
        });

        filteredMovies.forEach(movie => {
            let movieCardClass = 'movie-card';
            let showDetails = true;
            let templateId = 'movie-template';

            if (movie.note >= 4.2 && isImportBangerActive) {
                templateId = 'banger-template';
                movieCardClass = 'movie-card movie-card_banger';
            } else if (movie.note < parseFloat($('#badNote').val()) && isImportNavetActive) {
                templateId = 'navets';
                movieCardClass = 'movie-card movie-card_navet_border';
                showDetails = false;
            }

            const template = document.getElementById(templateId);
            const instance = template.content.cloneNode(true);

            const movieCardElement = instance.querySelector('.movie-card');
            if (movieCardElement) {
                movieCardElement.className = movieCardClass;
                movieCardElement.setAttribute('data-id', movie.id); // Ajoute l'ID du film à la carte
            }

            const movieDetails = instance.querySelector('.movie-details');
            if (movieDetails && templateId === 'movie-template') {
                movieDetails.style.display = showDetails ? '' : 'none';
            }

            if (templateId !== "navets") {
                const properties = ['nom', 'dateDeSortie', 'realisateur', 'note', 'notePublic', 'compagnie', 'description', 'lienImage', 'origine'];
                properties.forEach(prop => {
                    if (movie.hasOwnProperty(prop)) {
                        const element = instance.querySelector(`.${prop}`);
                        if (element) {
                            if (prop === 'lienImage' && movie[prop]) {
                                element.src = movie[prop];
                                element.alt = `Affiche du film ${movie.nom}`;
                            } else if (prop === 'description') {
                                element.textContent = "Description: " + (movie[prop] || 'N/A');
                            } else if (prop === 'note') {
                                const noteText = (movie[prop] !== null && movie[prop] !== undefined) ? movie[prop].toFixed(1) + "/5" : "N/A";
                                element.innerHTML = `Note: ${noteText} ` + getStars(movie[prop]);
                            } else {
                                element.textContent = movie[prop] || 'N/A';
                            }
                        }
                    }
                });

                const noteDifferenceElement = instance.querySelector('.noteDifference');
                if (noteDifferenceElement) {
                    if (movie.notePublic !== null && movie.notePublic !== undefined) {
                        const difference = Math.abs(movie.note - movie.notePublic).toFixed(1);
                        noteDifferenceElement.textContent = difference;
                    } else {
                        noteDifferenceElement.textContent = 'Note public indisponible';
                    }
                }
            } else {
                instance.querySelector('.nom').textContent = movie.nom;
                instance.querySelector('.lienImage').src = movie.lienImage;
                instance.querySelector('.lienImage').alt = `Affiche du film ${movie.nom}`;
            }

            const deleteButton = instance.querySelector('.delete-button');
            if (deleteButton) {
                deleteButton.addEventListener('click', function () {
                    const movieId = movie.id;
                    if (confirm("Voulez-vous vraiment supprimer ce film ?")) {
                        deleteMovie(movieId);
                    }
                });
            }

            const editButton = instance.querySelector('.edit-button');
            if (editButton) {
                editButton.addEventListener('click', function () {
                    const movieCard = $(this).closest('.movie-card');
                    const movieId = movieCard.attr('data-id'); // Récupère l'ID du film

                    // Stocke l'ID dans la modale
                    $('#edit-film-modal').data('id', movieId);

                    // Récupère les données actuelles du film
                    const movieData = {
                        nom: movieCard.find('.nom').text(),
                        dateDeSortie: movieCard.find('.dateDeSortie').text(), // Doit être une année (ex: 1960)
                        realisateur: movieCard.find('.realisateur').text(),
                        note: parseFloat(movieCard.find('.note').text().split('/')[0]),
                        notePublic: parseFloat(movieCard.find('.notePublic').text()),
                        compagnie: movieCard.find('.compagnie').text(),
                        description: movieCard.find('.description').text(),
                        origine: movieCard.find('.origine').text(),
                        lienImage: movieCard.find('.lienImage').attr('src') // Récupère le chemin de l'image
                    };

                    // Remplit le formulaire avec les données actuelles
                    $('#edit-nom').val(movieData.nom);
                    $('#edit-dateDeSortie').val(movieData.dateDeSortie); // Doit être une année (ex: 1960)
                    $('#edit-realisateur').val(movieData.realisateur);
                    $('#edit-note').val(movieData.note);
                    $('#edit-notePublic').val(movieData.notePublic);
                    $('#edit-compagnie').val(movieData.compagnie);
                    $('#edit-description').val(movieData.description);
                    $('#edit-origine').val(movieData.origine);
                    $('#edit-lienImage').val(movieData.lienImage); // Remplit le champ du lien de l'image

                    // Affiche la modale
                    $('#edit-film-modal').show();
                });
            }

            $('#movies-container').append(instance);
        });
    }

    // Fonction pour générer les étoiles en fonction de la note
    const getStars = (rating) => {
        if (rating === null || rating === undefined) {
            return "N/A";
        }
        const starCount = Math.floor(rating);
        let stars = "";
        for (let i = 0; i < starCount; i++) {
            stars += "<span class='star'>⭐</span>";
        }
        return stars;
    };

    // Fonction pour mettre à jour l'affichage des films
    function updateMovies() {
        displayMovies(moviesData);
    }

    // Fonction
    function deleteMovie(movieId) {
        $.ajax({
            url: `http://localhost:3000/films/${movieId}`,
            type: 'DELETE',
            success: function (response) {
                console.log("Film supprimé avec succès :", response);
                alert("Film supprimé avec succès !");
                loadMovies(); // Recharge la liste des films après la suppression
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors de la suppression du film :", error);
                alert("Erreur lors de la suppression du film.");
            }
        });
    }

    // Événement pour le bouton "Importer les classiques"
    $('#importBanger').on('click', function () {
        isImportBangerActive = !isImportBangerActive;
        $('#importNavets').removeClass('active');
        isImportNavetActive = false;
        $(this).toggleClass('active');
        loadMovies(); // Appeler loadMovies pour charger les films
    });

    // Événement pour le bouton "Importer les navets"
    $('#importNavets').on('click', function () {
        isImportNavetActive = !isImportNavetActive;
        $('#importBanger').removeClass('active');
        isImportBangerActive = false;
        $(this).toggleClass('active');
        loadMovies();
    });

    // Événement pour le bouton "Clear"
    $('#clearButton').on('click', function () {
        isImportBangerActive = false;
        isImportNavetActive = false;
        $('#importBanger').removeClass('active');
        $('#importNavets').removeClass('active');
        $('#FiltrePays').val('').prop('selectedIndex', 0); // Réinitialise à "Origine du film"
        $('#FiltreNiveau').val(''); // Réinitialise le filtre de niveau
        $('#noteMin').val(''); // Réinitialise la note minimale
        $('#noteMax').val(''); // Réinitialise la note maximale
        $('#movies-container').empty(); // Efface les films affichés
    });

    // Événement pour le bouton "Voir Films"
    $('#loadMoviesButton').on('click', function () {
        loadMovies();
    });

    // Événement pour le bouton "Appliquer les filtres"
    $('#appliquerFiltres').on('click', function () {
        loadMovies();
    });

    // Événement pour fermer la modale
    $('.close').on('click', function () {
        $('#edit-film-modal').hide();
    });

    // Événement pour enregistrer les modifications
    $('#edit-film-form').on('submit', function (e) {
        e.preventDefault();

        // Récupère l'ID du film stocké dans la modale
        const movieId = $('#edit-film-modal').data('id');
        console.log("ID du film à modifier :", movieId); // Log pour vérifier l'ID

        // Récupère les données du formulaire
        const updatedData = {
            nom: $('#edit-nom').val(),
            dateDeSortie: $('#edit-dateDeSortie').val(), // Doit être une année (ex: 1960)
            realisateur: $('#edit-realisateur').val(),
            note: parseFloat($('#edit-note').val()),
            notePublic: parseFloat($('#edit-notePublic').val()),
            compagnie: $('#edit-compagnie').val(),
            description: $('#edit-description').val(),
            origine: $('#edit-origine').val(),
        };

        // Ajoute le lien de l'image uniquement si le champ n'est pas vide
        const lienImage = $('#edit-lienImage').val();
        if (lienImage) {
            updatedData.lienImage = lienImage;
        }

        // Validation de l'année de sortie
        if (!/^\d{4}$/.test(updatedData.dateDeSortie)) {
            alert("Veuillez entrer une année valide (ex: 1960).");
            return;
        }

        // Envoie les modifications au backend
        $.ajax({
            url: `http://localhost:3000/films/${movieId}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function (response) {
                alert('Film modifié avec succès !');
                $('#edit-film-modal').hide();
                loadMovies(); // Recharge la liste des films
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors de la modification du film :", error);
                alert("Erreur lors de la modification du film.");
            }
        });
    });
});