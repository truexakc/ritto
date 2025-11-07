import {
    List,
    Datagrid,
    TextField,
    DateField,
    Show,
    SimpleShowLayout,
    ReferenceManyField,
    FunctionField, ReferenceField
} from 'react-admin';

export const OrderList = () => (
    <List>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <TextField source="status" />
            <TextField source="payment_status" />
            <DateField source="created_at" />
        </Datagrid>
    </List>
);

export const OrderShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="status" />
            <TextField source="payment_status" />
            <TextField source="payment_method" />
            <TextField source="shipping_address" />
            <DateField source="created_at" />

            <ReferenceManyField
                label="Товары"
                reference="order_items"
                target="order_id"
            >
                <Datagrid>
                    <ReferenceField source="product_id" reference="products" label="Название товара">
                        <TextField source="name" />
                    </ReferenceField>
                    <TextField source="quantity" label="Кол-во" />
                </Datagrid>
            </ReferenceManyField>



        </SimpleShowLayout>
    </Show>
);
