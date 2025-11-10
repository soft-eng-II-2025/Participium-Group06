import React from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";
import {useRegisterMunicipalityOfficer} from "../hook/adminApi.hook";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";

const AdminRegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const {mutateAsync: registerMunicipalityOfficer, isPending, error, isError} = useRegisterMunicipalityOfficer()

    const serverErrorMessage = error
        ? "Registration failed. Please try again." // If 'error' exists, use a custom string
        : null;

    const handleAdminRegister = async (payload: MunicipalityOfficerDTO) => {
        const addedOfficer = await registerMunicipalityOfficer(payload)
        // addedOfficer contiene i dati dell'utente appena registrato
        if(addedOfficer.status == 201 ){
            navigate("/admin/home")
        }
    };

    return (
        <RegistrationForm onSubmit={handleAdminRegister} loading={isPending} serverError={serverErrorMessage} />
    );
};

export default AdminRegisterPage;